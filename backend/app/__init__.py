# backend/app/__init__.py

# Import the core database components so they are 
# easily accessible from the 'app' package level.
from .database import Base, SessionLocal, get_db
from .config import settings

# This allows you to do: from app import settings 
# instead of: from app.config import settings