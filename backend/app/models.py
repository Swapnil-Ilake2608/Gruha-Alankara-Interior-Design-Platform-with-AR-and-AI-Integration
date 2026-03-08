from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    designs = relationship("Design", back_populates="owner")
    bookings = relationship("Booking", back_populates="user")


class Design(Base):
    __tablename__ = "designs"
    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(String)
    style_theme = Column(String)
    ai_output = Column(JSON)
    buddy_voice_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="designs")
    bookings = relationship("Booking", back_populates="design")


class Furniture(Base):
    __tablename__ = "furniture"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    category = Column(String)
    price = Column(Float)
    image_url = Column(String)


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(Integer, primary_key=True, index=True)
    status = Column(String, default="pending")
    booking_date = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    design_id = Column(Integer, ForeignKey("designs.id"))
    furniture_id = Column(Integer, ForeignKey("furniture.id"))

    user = relationship("User", back_populates="bookings")
    design = relationship("Design", back_populates="bookings")


class DesignAnalysisCache(Base):
    __tablename__ = "design_analysis_cache"

    id = Column(Integer, primary_key=True, index=True)
    input_hash = Column(String, unique=True, index=True, nullable=False)
    style_theme = Column(String, nullable=False)
    lang = Column(String, nullable=False)
    room_fingerprint = Column(String, nullable=True)
    ai_output = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, default=datetime.utcnow)
    hit_count = Column(Integer, default=0)
