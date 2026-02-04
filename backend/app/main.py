"""FastAPI Application Entry Point"""

from enum import auto
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import close_databases, init_databases
from app.api import chat, research, financial, news, health, search
from app.auth.auth_router import router as auth_router 
from fastapi.responses import FileResponse



# Create FastAPI app (NO comma here!)
app = FastAPI(
    title="Conversational Equity Research",
    version="1.0.0",
    description="AI powered stock research platform"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(health.router, prefix="/api", tags=["health"])
#app.include_router(chat.router, prefix="/api", tags=["chat"])
#app.include_router(research.router, prefix="/api", tags=["research"])
#app.include_router(financial.router, prefix="/api", tags=["financial"])
#app.include_router(news.router, prefix="/api", tags=["news"])
app.include_router(search.router, prefix="/api", tags=["search"])


@app.get("/")
def root():
    return {
        "message": " Conversational Equity Research API is running",
    } 
    

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse("app/static/favicon.ico")

# Startup & shutdown
@app.on_event("startup")
async def startup():
    await init_databases()
    print("🚀 Conversational Equity Research API started")

@app.on_event("shutdown")
async def shutdown():
    await close_databases()

# Global error handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"error": str(exc)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
