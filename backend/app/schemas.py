from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, HttpUrl, Field


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DesignBase(BaseModel):
    style_theme: str
    image_path: str


class DesignCreate(DesignBase):
    pass


class DesignOut(DesignBase):
    id: int
    user_id: int
    ai_output: Optional[dict] = None
    buddy_voice_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FurnitureOut(BaseModel):
    id: int
    name: str
    category: str
    price: float
    image_url: HttpUrl

    class Config:
        from_attributes = True


class BookingCreate(BaseModel):
    design_id: int
    furniture_id: int


class BookingOut(BaseModel):
    id: int
    status: str
    booking_date: datetime
    user_id: int
    design_id: int
    furniture_id: int
    furniture_name: Optional[str] = None
    furniture_price: Optional[float] = None

    class Config:
        from_attributes = True


class BuddyChatRequest(BaseModel):
    user_id: int
    design_id: int
    message: str
    lang: str = "en"
    auto_book: bool = True


class BuddyChatResponse(BaseModel):
    reply: str
    action: str
    lang: str
    suggested_actions: list[str] = Field(default_factory=list)
    recommendations: list[Any] = Field(default_factory=list)
    bookings: list[BookingOut] = Field(default_factory=list)





