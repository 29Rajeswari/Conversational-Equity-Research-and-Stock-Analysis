"""Chat Service"""
from app.rag.rag_pipeline import rag_pipeline
from app.conversational.response_generator import response_generator
from app.conversational.memory import ConversationMemory
from app.schemas.chat import ChatRequest, ChatResponse

class ChatService:
    def __init__(self, db):
        self.memory = ConversationMemory(db)
    
    async def process_query(self, request: ChatRequest):
        try:
            print("Running RAG pipeline...")
            context = await rag_pipeline.run(request.query)
            print("RAG Context:", context[:200] if context else "EMPTY")

            print("Calling Gemini...")
            answer = await response_generator.generate_response(request.query, context)
            print("Gemini Answer:", answer[:200])

        except Exception as e:
            print("LLM / RAG ERROR:", repr(e))
            raise e

        await self.memory.save_message(request.session_id, "user", request.query)
        await self.memory.save_message(request.session_id, "assistant", answer)

        return ChatResponse(answer=answer, sources=[])

