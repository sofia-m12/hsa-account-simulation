from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://hsa:hsa@localhost:5432/hsa"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
