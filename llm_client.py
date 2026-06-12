"""大模型请求封装模块"""

import json
import os
from typing import List

from dotenv import load_dotenv
from openai import OpenAI

# 加载环境变量
load_dotenv()

API_KEY = os.getenv("OPENAI_API_KEY")
BASE_URL = os.getenv("OPENAI_BASE_URL")
MODEL_NAME = "qwen3.7-plus"

_SYSTEM_PROMPT = (
    "你是一个高级学术助理，专注于机器学习与计算机安全领域。"
    "你的任务是阅读提供的论文片段，忽略常规、宽泛的学术词汇，"
    "精准提炼出 5-8 个最能代表该论文核心机制、攻击方法"
    "（如后门攻击细节、投毒策略）或防御方案的专业技术术语关键词。"
    "你必须以标准 JSON 格式返回结果，格式如下：\n"
    '{"keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"]}'
)


class LLMClient:
    """封装 OpenAI 兼容接口的大模型客户端"""

    def __init__(self) -> None:
        if not API_KEY:
            raise ValueError(
                "环境变量 OPENAI_API_KEY 未设置，"
                "请在 .env 文件中配置 API Key。"
            )

        self.client = OpenAI(
            api_key=API_KEY,
            base_url=BASE_URL,
        )

    def extract_keywords(self, paper_text: str) -> List[str]:
        """
        调用大模型从论文文本中提取核心关键词。

        Args:
            paper_text: 清洗后的论文文本片段

        Returns:
            关键词字符串列表

        Raises:
            ConnectionError: 网络连接异常
            ValueError: API 认证失败或返回格式异常
        """
        try:
            response = self.client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": f"以下是论文的核心文本片段：\n\n{paper_text}\n\n"
                        f"请根据系统提示的要求，提取关键词并以 JSON 格式返回。",
                    },
                ],
                temperature=0.3,
                max_tokens=512,
            )
        except Exception as e:
            raise ConnectionError(f"调用大模型 API 失败: {e}") from e

        content = response.choices[0].message.content
        if not content:
            raise ValueError("大模型返回内容为空。")

        return self._parse_keywords(content)

    @staticmethod
    def _parse_keywords(content: str) -> List[str]:
        """
        解析大模型返回的 JSON 内容，提取 keywords 数组。

        Args:
            content: 模型返回的原始文本（可能包含 markdown 代码块）

        Returns:
            关键词列表

        Raises:
            ValueError: JSON 解析失败或格式不符合预期
        """
        # 去除可能的 markdown 代码块标记
        cleaned = content.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError as e:
            raise ValueError(f"返回内容不是合法 JSON: {e}\n原始内容:\n{cleaned}")

        if not isinstance(data, dict):
            raise ValueError(f"JSON 根节点应为对象，实际为: {type(data).__name__}")

        keywords = data.get("keywords")
        if not isinstance(keywords, list):
            raise ValueError(
                f'JSON 中 "keywords" 字段应为数组，实际为: {type(keywords).__name__}'
            )

        # 确保所有元素都是字符串
        return [str(k).strip() for k in keywords if str(k).strip()]


if __name__ == "__main__":
    import re
    import sys

    if len(sys.argv) < 2:
        print("用法: python llm_client.py <测试文本>")
        sys.exit(1)

    client = LLMClient()
    try:
        keywords = client.extract_keywords(sys.argv[1])
        print("提取到的关键词:")
        for i, kw in enumerate(keywords, 1):
            print(f"  {i}. {kw}")
    except Exception as e:
        print(f"错误: {e}")
        sys.exit(1)
