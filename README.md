# Conversational Equity Research Platform

AI-powered conversational equity research system with RAG, multi-source data ingestion, and comprehensive financial analysis.

## 🎯 Features

- 💬 **Conversational Interface** - Natural language queries
- 📊 **Multi-Source Data** - Alpha Vantage, Finnhub, SEC filings, News APIs
- 🧠 **RAG System** - ChromaDB vector store with semantic search
- 📈 **Financial Analysis** - Liquidity, solvency, growth, valuation
- 🔍 **Risk Assessment** - Market and business risk analysis
- 📝 **Report Generation** - Comprehensive stock research reports
- 💾 **Conversation Memory** - MongoDB-backed chat history

## 🚀 Quick Start

```bash
# Clone and setup
cd Conversational-Equity-Research
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure
cp .env.example .env
# Add your API keys to .env

# Run
uvicorn backend.app.main:app --reload
```

## 📁 Architecture

- **MCP Layer**: External data connectors (Alpha Vantage, SEC, News)
- **Ingestion Layer**: Data fetching and cleaning
- **Embedding Layer**: Text to vector conversion (ChromaDB)
- **RAG Layer**: Context retrieval and augmentation
- **LLM Layer**: Gemini integration
- **Research Engine**: Financial analysis algorithms
- **Conversational Layer**: Intent detection and routing
- **API Layer**: REST endpoints

## 🔑 Required API Keys

- Gemini API Key (Google AI)
- Alpha Vantage API Key
- Finnhub API Key (optional)
- NewsAPI Key (optional)
- MongoDB URI

## 📚 Documentation

See individual module READMEs for detailed documentation.

-Test backend update
-Update test – backend


notepad README.md
Root README update test
