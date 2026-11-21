import os
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    DB_HOST: str = "ls-b12cc9081f17b594187264e8c7fe42119a9bb93f.cgt2s428cp85.us-east-1.rds.amazonaws.com"
    DB_PORT: int = 5432
    DB_NAME: str = "postgres"
    DB_USER: str = "dbmasteruser"
    DB_PASSWORD: str = "pidemala"
    DB_SCHEMA: str = "bdstudiobj"
    DATABASE_URL: str = (
        "postgresql+psycopg://dbmasteruser:pidemala@"
        "ls-b12cc9081f17b594187264e8c7fe42119a9bb93f.cgt2s428cp85.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=require"
    )

    JWT_SECRET_KEY: str = "9a8f3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    ADMIN_EMAIL: str = "roderick.espinoza@gmail.com"
    ADMIN_PASSWORD: str = "12345678"
    ADMIN_NOMBRE: str = "Roderick Espinoza"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

settings = Settings()
