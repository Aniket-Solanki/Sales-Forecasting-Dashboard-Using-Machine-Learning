from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "sales_user"
    POSTGRES_PASSWORD: str = "sales_password"
    POSTGRES_DB: str = "sales_forecasting"

    @property
    def DATABASE_URL(self) -> str:
        ssl_mode = "?sslmode=require" if self.POSTGRES_SERVER not in ("localhost", "127.0.0.1") else ""
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}{ssl_mode}"
        )

    @property
    def DATABASE_URL_SYNC(self) -> str:
        ssl_mode = "?sslmode=require" if self.POSTGRES_SERVER not in ("localhost", "127.0.0.1") else ""
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}{ssl_mode}"
        )

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # MLflow
    MLFLOW_TRACKING_URI: str = "http://localhost:5000"

    # App
    APP_NAME: str = "Sales Forecasting Dashboard"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()