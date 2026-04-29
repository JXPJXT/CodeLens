from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    groq_api_key: str
    llm_model_id: str
    risk_threshold: float = 0.4
    cnn_model_path: str
    vocab_path: str
    database_url: str
    log_level: str = "INFO"
    backend_port: int = 8000
    cache_enabled: bool = True
    max_code_length: int = 256

    class Config:
        env_file = "../.env"
        extra = "ignore"

settings = Settings()
