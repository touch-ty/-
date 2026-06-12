"""主程序入口"""

import json
from pathlib import Path

from pdf_extractor import extract_pdf_text
from llm_client import LLMClient


def print_banner(title: str) -> None:
    """在控制台打印美观的分隔横幅"""
    width = 60
    print("\n" + "=" * width)
    print(title.center(width))
    print("=" * width + "\n")


def print_keywords(keywords: list[str]) -> None:
    """美观地打印关键词列表"""
    print("┌" + "─" * 58 + "┐")
    print("│" + " 提取结果 ".center(56) + "│")
    print("├" + "─" * 58 + "┤")
    for i, kw in enumerate(keywords, 1):
        line = f"  {i}. {kw}"
        print("│" + line.ljust(56) + "│")
    print("└" + "─" * 58 + "┘")


def save_result(keywords: list[str], pdf_path: str) -> Path:
    """
    将结果保存为本地 JSON 文件。

    Args:
        keywords: 提取出的关键词列表
        pdf_path: 原始 PDF 路径（用于记录来源）

    Returns:
        生成的 JSON 文件路径
    """
    result = {
        "source_pdf": str(Path(pdf_path).resolve()),
        "keywords_count": len(keywords),
        "keywords": keywords,
    }

    output_path = Path("keywords_result.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    return output_path


def main() -> None:
    print_banner("学术论文关键词提取工具")

    pdf_path = input("请输入本地 PDF 论文的路径: ").strip()
    if not pdf_path:
        print("错误: 路径不能为空。")
        return

    # 1. 提取 PDF 文本
    print("\n[1/3] 正在提取 PDF 核心文本...")
    try:
        paper_text = extract_pdf_text(pdf_path)
        print(f"    ✓ 提取成功，共 {len(paper_text)} 个字符")
    except FileNotFoundError as e:
        print(f"    ✗ {e}")
        return
    except ValueError as e:
        print(f"    ✗ {e}")
        return

    # 2. 调用大模型提取关键词
    print("\n[2/3] 正在调用大模型分析文本...")
    client = LLMClient()
    try:
        keywords = client.extract_keywords(paper_text)
        print(f"    ✓ 分析完成，提取到 {len(keywords)} 个关键词")
    except ConnectionError as e:
        print(f"    ✗ 网络/连接异常: {e}")
        return
    except ValueError as e:
        print(f"    ✗ API 返回异常: {e}")
        return

    # 3. 打印并保存结果
    print("\n[3/3] 结果输出与保存...")
    print_keywords(keywords)

    output_path = save_result(keywords, pdf_path)
    print(f"\n    ✓ 结果已保存至: {output_path.resolve()}")

    print("\n" + "=" * 60)
    print("处理完成，感谢使用！".center(60))
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
