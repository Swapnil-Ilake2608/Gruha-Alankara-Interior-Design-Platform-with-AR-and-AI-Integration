import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Security & Auth
    SECRET_KEY: str = "your_super_secret_key_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database (SQLite URI)
    DATABASE_URL: str = "sqlite:///./gruha_alankara.db"

    # AI provider credentials
    WATSONX_API_KEY: str | None = None
    PROJECT_ID: str | None = None
    GROQ_API_KEY: str | None = None

    # AI runtime controls
    # ibm_granite | ibm | groq | local
    AI_PROVIDER: str = "groq"
    AI_TIMEOUT_SECONDS: int = 15
    AI_RETRIES: int = 2

    # IBM Granite model selection
    IBM_GRANITE_MODEL_ID: str = "ibm/granite-3-8b-instruct"

    # Optional feature toggles
    ENABLE_TRANSFORMERS_CV: bool = True
    ENABLE_LANGCHAIN_PROMPTS: bool = True

    # Voice runtime controls
    TTS_TIMEOUT_SECONDS: int = 20
    TTS_RETRIES: int = 1

    # File upload settings
    UPLOAD_DIR: str = "app/uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024
    MAX_VIDEO_FILE_SIZE: int = 50 * 1024 * 1024
    ALLOWED_IMAGE_EXTENSIONS: set[str] = {"png", "jpg", "jpeg"}
    ALLOWED_VIDEO_EXTENSIONS: set[str] = {"mp4", "webm", "mov", "avi", "mkv"}

    @property
    def ALLOWED_EXTENSIONS(self) -> set[str]:
        return self.ALLOWED_IMAGE_EXTENSIONS | self.ALLOWED_VIDEO_EXTENSIONS

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

if not os.path.exists(settings.UPLOAD_DIR):
    os.makedirs(settings.UPLOAD_DIR)



