"""PDF 核心文本提取模块"""

import re
import pdfplumber
from pathlib import Path


def extract_pdf_text(pdf_path: str) -> str:
    """
    接收本地 PDF 文件路径，读取前 2 页和最后一页的核心文本。

    Args:
        pdf_path: 本地 PDF 文件的绝对或相对路径

    Returns:
        清洗后的文本字符串

    Raises:
        FileNotFoundError: PDF 文件不存在
        ValueError: PDF 为纯图片扫描版，提取文本为空
    """
    path = Path(pdf_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF 文件不存在: {pdf_path}")

    extracted_texts: list[str] = []

    with pdfplumber.open(path) as pdf:
        total_pages = len(pdf.pages)
        if total_pages == 0:
            raise ValueError("PDF 文件页数为零，无法读取。")

        # 确定要读取的页码：前 2 页 + 最后一页
        target_pages = list(range(min(2, total_pages)))
        if total_pages > 2:
            target_pages.append(total_pages - 1)

        for page_idx in target_pages:
            page = pdf.pages[page_idx]
            text = page.extract_text()
            if text:
                extracted_texts.append(text)

    raw_text = "\n".join(extracted_texts)

    if not raw_text.strip():
        raise ValueError(
            "提取到的文本为空，该 PDF 可能是纯图片扫描版，"
            "请先使用 OCR 工具处理后再试。"
        )

    return _clean_text(raw_text)


def _clean_text(text: str) -> str:
    """
    清洗文本：剔除多余换行、破折号断词、乱码符号等。

    Args:
        text: 原始提取文本

    Returns:
        清洗后的文本
    """
    # 1. 合并被换行截断的单词（例如 "back-\ndoor" -> "backdoor"）
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)

    # 2. 将多个连续换行符替换为单个换行
    text = re.sub(r"\n+", "\n", text)

    # 3. 剔除常见乱码/不可见字符（保留基本中英文标点）
    text = re.sub(r"[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef\w\s\-.,;:!?()'\"/%@&=+<>", text)

    # 4. 剔除多余空格
    text = re.sub(r"[ \t]+", " ", text)

    return text.strip()


if __name__ == "__main__":
    # 简单的自测入口
    import sys

    if len(sys.argv) < 2:
        print("用法: python pdf_extractor.py <pdf_path>")
        sys.exit(1)

    try:
        result = extract_pdf_text(sys.argv[1])
        print("提取成功，文本长度:", len(result))
        print(result[:500])
    except Exception as e:
        print(f"错误: {e}")
        sys.exit(1)
