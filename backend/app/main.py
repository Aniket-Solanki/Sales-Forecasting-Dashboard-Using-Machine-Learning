from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.db.session import async_engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    await async_engine.dispose()


settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    description="Sales Forecasting Dashboard API",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.v1.api import api_router

app.include_router(api_router, prefix=settings.API_V1_STR)



@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "sales-forecasting-api"}


@app.get("/")
async def root():
    return {
        "message": "Welcome to Sales Forecasting Dashboard API",
        "docs": "/docs",
        "health": "/health",
    }