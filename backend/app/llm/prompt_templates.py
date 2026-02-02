"""Financial Prompt Templates"""

FINANCIAL_ANALYSIS_PROMPT = """
Analyze the following financial data for {symbol}:

{context}

Provide:
1. Financial health assessment
2. Growth trends
3. Key risks
4. Investment recommendation

Be concise and data-driven.
"""

CHAT_PROMPT = """
You are a financial analyst assistant. Answer the following question:

Question: {query}

Context: {context}

Provide a clear, accurate response.
"""
