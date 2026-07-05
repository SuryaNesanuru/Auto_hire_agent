import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AutoHire AI Backend"
    API_V1_STR: str = "/api/v1"
    
    # Security Configuration
    JWT_SECRET: str = "32b2361ac7e2fedb2aa9d0e2e2fd69d05e24aab5e305e94b2a3cd5e12f694e9f"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120 # Matches PRD section 6.1
    
    # Encryption key for Database columns (AES-256-GCM hex key)
    DATABASE_AES_ENCRYPTION_KEY: str = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
    
    # Storage Configuration
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "autohire"
    POSTGRES_PORT: str = "5432"
    DATABASE_URL: Optional[str] = "sqlite:///./autohire.db"

    # Qdrant Configuration
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: Optional[str] = None

    # Local Ollama Inference Configuration
    OLLAMA_URL: str = "http://localhost:11434"
    
    # Deployment modes config
    DEPLOY_MODE: str = "DEV" # "DEV" or "PROD" (DEV bypasses external OAuth logins)

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env")

    @property
    def get_db_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
