import os
import re
import uuid
from datetime import datetime
from typing import Any, List, Optional

from jose import JWTError, jwt

from fastapi import BackgroundTasks, Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import Base, SessionLocal, engine, get_db
from app.models import Booking, Design, DesignAnalysisCache, Furniture, User
from app.schemas import (
    BookingCreate,
    BookingOut,
    BuddyChatRequest,
    BuddyChatResponse,
    DesignOut,
    FurnitureOut,
    UserCreate,
    UserLogin,
    UserOut,
)
from app.utils import (
    analyze_room_media,
    compute_input_hash,
    create_access_token,
    generate_ai_design_suggestions,
    generate_buddy_voice,
    hash_password,
    verify_password,
)

# Initialize Database Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Gruha Alankara API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/")
def health_check():
    return {
        "status": "Gruha Alankara Backend Online",
        "time": datetime.now(),
        "ai_provider": settings.AI_PROVIDER,
    }


@app.get("/health/ready")
def readiness_check(db: Session = Depends(get_db)):
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    upload_dir_ok = os.path.isdir(settings.UPLOAD_DIR)

    return {
        "ready": db_ok and upload_dir_ok,
        "database": "ok" if db_ok else "error",
        "upload_dir": settings.UPLOAD_DIR,
        "upload_dir_exists": upload_dir_ok,
        "ai_provider": settings.AI_PROVIDER,
        "time": datetime.now(),
    }



bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    auth: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not auth or auth.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    try:
        payload = jwt.decode(auth.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user



def get_current_user_optional(
    auth: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if not auth or auth.scheme.lower() != "bearer":
        return None
    try:
        payload = jwt.decode(auth.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            return None
        return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        return None
def _ensure_owner_user(path_user_id: int, current_user: User | None) -> None:
    if current_user and path_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this user")


def _ensure_design_owner(db: Session, design_id: int, current_user: User) -> Design:
    design = db.query(Design).filter(Design.id == design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    if current_user and design.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this design")
    return design
def _ensure_upload_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        return user

    user = db.query(User).order_by(User.id.asc()).first()
    if user:
        return user

    demo_user = User(
        username="demo_user",
        email="demo_user@gruha.local",
        password_hash=hash_password("demo1234"),
    )
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)
    return demo_user


# --- Authentication ---
@app.post("/register", response_model=UserOut)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    normalized_email = user.email.strip().lower()
    normalized_username = user.username.strip()

    existing_email = db.query(User).filter(User.email == normalized_email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = db.query(User).filter(User.username == normalized_username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    new_user = User(
        username=normalized_username,
        email=normalized_email,
        password_hash=hash_password(user.password),
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username or email already exists")

@app.post("/login")
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_credentials.email).first()
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid Credentials")

    token = create_access_token(data={"sub": user.email, "user_id": user.id})
    return {"access_token": token, "token_type": "bearer", "user_id": user.id}


# --- AI Design & Buddy Agent ---
@app.post("/upload/{user_id}", response_model=DesignOut)
async def upload_and_analyze(
    user_id: int,
    background_tasks: BackgroundTasks,
    style_theme: str = Form("Modern"),
    lang: str = Form("en"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    _ensure_owner_user(user_id, current_user)
    user = current_user or _ensure_upload_user(db, user_id)

    filename = file.filename or "upload.bin"
    extension = filename.split(".")[-1].lower()
    if extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type")

    max_size = settings.MAX_VIDEO_FILE_SIZE if extension in settings.ALLOWED_VIDEO_EXTENSIONS else settings.MAX_FILE_SIZE

    unique_filename = f"{uuid.uuid4()}.{extension}"
    full_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    file_size = 0

    with open(full_path, "wb") as buffer:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            file_size += len(chunk)
            if file_size > max_size:
                buffer.close()
                os.remove(full_path)
                limit_mb = max_size // (1024 * 1024)
                raise HTTPException(status_code=400, detail=f"File too large (Max {limit_mb}MB)")
            buffer.write(chunk)

    with open(full_path, "rb") as media_reader:
        media_content = media_reader.read()

    room_analysis = analyze_room_media(media_content, extension)
    input_hash = compute_input_hash(media_content, style_theme, lang)

    cache_entry = db.query(DesignAnalysisCache).filter(DesignAnalysisCache.input_hash == input_hash).first()
    if cache_entry:
        ai_suggestions = cache_entry.ai_output
        cache_entry.hit_count = (cache_entry.hit_count or 0) + 1
        cache_entry.last_used_at = datetime.utcnow()
        db.commit()
    else:
        ai_suggestions = generate_ai_design_suggestions(style_theme, lang=lang, room_analysis=room_analysis)
        new_cache = DesignAnalysisCache(
            input_hash=input_hash,
            style_theme=style_theme,
            lang=lang,
            room_fingerprint=room_analysis.get("room_fingerprint"),
            ai_output=ai_suggestions,
            hit_count=0,
        )
        db.add(new_cache)
        db.commit()

    new_design = Design(
        image_path=f"uploads/{unique_filename}",
        style_theme=style_theme,
        user_id=user.id,
        ai_output=ai_suggestions,
        buddy_voice_path=None,
    )
    db.add(new_design)
    db.commit()
    db.refresh(new_design)

    background_tasks.add_task(_generate_and_store_buddy_voice, new_design.id, ai_suggestions, lang)

    return new_design


@app.get("/designs/{user_id}", response_model=List[DesignOut])
def list_user_designs(user_id: int, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    _ensure_owner_user(user_id, current_user)
    return (
        db.query(Design)
        .filter(Design.user_id == user_id)
        .order_by(Design.created_at.desc())
        .all()
    )

@app.get("/design/{design_id}", response_model=DesignOut)
def get_design(design_id: int, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    design = _ensure_design_owner(db, design_id, current_user)
    return design


def _generate_and_store_buddy_voice(design_id: int, ai_suggestions: dict, lang: str) -> None:
    voice_filename = generate_buddy_voice(ai_suggestions, lang=lang)
    if not voice_filename:
        return

    db = SessionLocal()
    try:
        design = db.query(Design).filter(Design.id == design_id).first()
        if not design:
            return
        design.buddy_voice_path = f"uploads/{voice_filename}"
        db.commit()
    finally:
        db.close()


# --- Furniture + Booking APIs ---
@app.get("/furniture", response_model=List[FurnitureOut])
def list_furniture(db: Session = Depends(get_db)):
    return db.query(Furniture).all()


def _booking_to_out(booking: Booking, db: Session) -> dict:
    item = db.query(Furniture).filter(Furniture.id == booking.furniture_id).first()
    return {
        "id": booking.id,
        "status": booking.status,
        "booking_date": booking.booking_date,
        "user_id": booking.user_id,
        "design_id": booking.design_id,
        "furniture_id": booking.furniture_id,
        "furniture_name": item.name if item else None,
        "furniture_price": float(item.price) if item and item.price is not None else None,
    }


def _format_price_inr(value: float | None) -> str:
    if value is None:
        return "price unavailable"
    try:
        return f"Rs {int(round(float(value))):,}"
    except Exception:
        return "price unavailable"

@app.post("/bookings", response_model=BookingOut)
def create_booking(booking: BookingCreate, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    design = db.query(Design).filter(Design.id == booking.design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")

    furniture = db.query(Furniture).filter(Furniture.id == booking.furniture_id).first()
    if not furniture:
        raise HTTPException(status_code=404, detail="Furniture not found")

    new_booking = Booking(
        user_id=design.user_id,
        design_id=booking.design_id,
        furniture_id=booking.furniture_id,
        status="confirmed",
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)
    return _booking_to_out(new_booking, db)


def _seed_default_furniture(db: Session) -> int:
    existing = db.query(Furniture).count()
    if existing > 0:
        return 0

    default_items = [
        {
            "name": "Modern Sofa",
            "category": "Seating",
            "price": 45999,
            "image_url": "https://example.com/images/sofa.jpg",
        },
        {
            "name": "Minimal Coffee Table",
            "category": "Table",
            "price": 12999,
            "image_url": "https://example.com/images/coffee-table.jpg",
        },
        {
            "name": "Floor Lamp",
            "category": "Lighting",
            "price": 5999,
            "image_url": "https://example.com/images/floor-lamp.jpg",
        },
        {
            "name": "Accent Chair",
            "category": "Seating",
            "price": 11999,
            "image_url": "https://example.com/images/accent-chair.jpg",
        },
        {
            "name": "Wooden Wardrobe",
            "category": "Storage",
            "price": 28999,
            "image_url": "https://example.com/images/wardrobe.jpg",
        },
        {
            "name": "Sheesham Dining Set",
            "category": "Table",
            "price": 55999,
            "image_url": "https://example.com/images/sheesham-dining.jpg",
        },
        {
            "name": "Cane Lounge Chair",
            "category": "Seating",
            "price": 14999,
            "image_url": "https://example.com/images/cane-chair.jpg",
        },
        {
            "name": "Brass Floor Diya Lamp",
            "category": "Lighting",
            "price": 7999,
            "image_url": "https://example.com/images/brass-lamp.jpg",
        },
    ]

    for item in default_items:
        db.add(Furniture(**item))
    db.commit()
    return len(default_items)


def _name_tokens(text: str) -> set[str]:
    return {t for t in re.split(r"[^a-z0-9]+", (text or "").lower()) if len(t) >= 3}


def _extract_recommendation_item(rec: Any) -> str:
    if isinstance(rec, dict):
        return str(rec.get("item") or rec.get("name") or rec.get("furniture") or "").strip()
    return str(rec or "").strip()


def _infer_category(name: str) -> str:
    n = name.lower()
    if any(k in n for k in ["bed", "wardrobe", "nightstand"]):
        return "Bedroom"
    if any(k in n for k in ["bookshelf", "shelf", "cabinet", "storage"]):
        return "Storage"
    if any(k in n for k in ["table", "desk", "coffee table"]):
        return "Table"
    if any(k in n for k in ["lamp", "light", "chandelier"]):
        return "Lighting"
    if any(k in n for k in ["sofa", "chair", "stool", "bench"]):
        return "Seating"
    return "Decor"


def _infer_price(name: str) -> float:
    n = name.lower()
    if "bed" in n:
        return 35999
    if "bookshelf" in n or "wardrobe" in n:
        return 24999
    if "desk" in n:
        return 17999
    if "sofa" in n:
        return 45999
    if "chair" in n:
        return 11999
    if "table" in n:
        return 12999
    if "lamp" in n or "light" in n:
        return 5999
    return 9999


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "item"


def _sync_recommendations_to_catalog(db: Session, recommendations: list[Any]) -> list[Furniture]:
    catalog = db.query(Furniture).all()
    by_name = {re.sub(r"\s+", " ", (c.name or "").strip().lower()): c for c in catalog}

    resolved: list[Furniture] = []
    created = False

    for rec in recommendations:
        name = _extract_recommendation_item(rec)
        if not name:
            continue

        norm = re.sub(r"\s+", " ", name.strip().lower())
        item = by_name.get(norm)

        if not item:
            item = Furniture(
                name=name,
                category=_infer_category(name),
                price=_infer_price(name),
                image_url=f"https://example.com/catalog/{_slugify(name)}.jpg",
            )
            db.add(item)
            db.flush()
            by_name[norm] = item
            created = True

        resolved.append(item)

    if created:
        db.commit()

    return resolved


def _find_catalog_match(requested_name: str, catalog: list[Furniture]) -> Furniture | None:
    requested_name = (requested_name or "").strip().lower()
    if not requested_name:
        return None

    for item in catalog:
        name = (item.name or "").lower()
        if requested_name in name or name in requested_name:
            return item

    req_tokens = _name_tokens(requested_name)
    best_item = None
    best_score = 0
    for item in catalog:
        name_tokens = _name_tokens(item.name or "")
        score = len(req_tokens & name_tokens)
        if score > best_score:
            best_score = score
            best_item = item

    return best_item if best_score > 0 else None


def _auto_book_from_design(db: Session, design: Design, booking_user_id: int | None = None) -> list[Booking]:
    recommendations = (design.ai_output or {}).get("furniture_recommendations", [])
    if not recommendations:
        return []

    # Core requirement: AI recommendations are first synced into catalog.
    _sync_recommendations_to_catalog(db, recommendations)

    if db.query(Furniture).count() == 0:
        _seed_default_furniture(db)

    catalog = db.query(Furniture).all()
    created: list[Booking] = []
    target_user_id = booking_user_id or design.user_id

    for rec in recommendations:
        requested_name = _extract_recommendation_item(rec).lower()
        if not requested_name:
            continue

        match = _find_catalog_match(requested_name, catalog)
        if not match:
            continue

        already = (
            db.query(Booking)
            .filter(
                Booking.user_id == target_user_id,
                Booking.design_id == design.id,
                Booking.furniture_id == match.id,
            )
            .first()
        )
        if already:
            created.append(already)
            continue

        new_booking = Booking(
            user_id=target_user_id,
            design_id=design.id,
            furniture_id=match.id,
            status="auto_confirmed",
        )
        db.add(new_booking)
        db.flush()
        created.append(new_booking)

    db.commit()
    return created


def _matched_catalog_items_for_design(db: Session, design: Design) -> list[Furniture]:
    recommendations = (design.ai_output or {}).get("furniture_recommendations", [])
    if not recommendations:
        return []

    # Sync AI recommendations into catalog first.
    synced = _sync_recommendations_to_catalog(db, recommendations)
    if synced:
        return synced

    if db.query(Furniture).count() == 0:
        _seed_default_furniture(db)

    catalog = db.query(Furniture).all()
    matched: list[Furniture] = []
    seen_ids: set[int] = set()

    for rec in recommendations:
        requested_name = _extract_recommendation_item(rec).lower()
        if not requested_name:
            continue

        match = _find_catalog_match(requested_name, catalog)
        if match and match.id not in seen_ids:
            matched.append(match)
            seen_ids.add(match.id)

    return matched


@app.post("/bookings/auto/{design_id}", response_model=List[BookingOut])
def auto_book_from_design(design_id: int, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    design = _ensure_design_owner(db, design_id, current_user)
    bookings = _auto_book_from_design(db, design, booking_user_id=current_user.id if current_user else design.user_id)
    return [_booking_to_out(b, db) for b in bookings]


@app.get("/bookings/user/{user_id}", response_model=List[BookingOut])
def list_user_bookings(user_id: int, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    _ensure_owner_user(user_id, current_user)
    bookings = db.query(Booking).filter(Booking.user_id == user_id).all()
    return [_booking_to_out(b, db) for b in bookings]


def _invoice_payload(db: Session, design: Design, bookings: list[Booking]) -> dict:
    line_items = []
    total_amount = 0.0
    for booking in bookings:
        item = db.query(Furniture).filter(Furniture.id == booking.furniture_id).first()
        if not item:
            continue
        price = float(item.price or 0)
        total_amount += price
        line_items.append(
            {
                "booking_id": booking.id,
                "item_name": item.name,
                "category": item.category,
                "price": price,
                "status": booking.status,
            }
        )

    invoice_id = f"INV-{design.id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    return {
        "invoice_id": invoice_id,
        "design_id": design.id,
        "user_id": design.user_id,
        "style_theme": design.style_theme,
        "issued_at": datetime.utcnow(),
        "line_items": line_items,
        "total_amount": round(total_amount, 2),
        "vendor_contact": "sales@gruhalankara.ai | +91-98765-43210",
    }


@app.get("/invoice/{design_id}")
def get_invoice(design_id: int, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    design = _ensure_design_owner(db, design_id, current_user)
    bookings = db.query(Booking).filter(Booking.design_id == design.id).all()
    return _invoice_payload(db, design, bookings)


@app.post("/purchase/one-tap/{design_id}")
def one_tap_purchase(design_id: int, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    design = _ensure_design_owner(db, design_id, current_user)
    bookings = _auto_book_from_design(db, design, booking_user_id=current_user.id if current_user else design.user_id)
    invoice = _invoice_payload(db, design, bookings)
    return {
        "message": "One-tap purchase completed",
        "bookings": [_booking_to_out(b, db) for b in bookings],
        **invoice,
    }

@app.post("/furniture/seed")
def seed_furniture(db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    created = _seed_default_furniture(db)
    if created == 0:
        return {"message": "Furniture already seeded", "count": db.query(Furniture).count()}
    return {"message": "Furniture seeded", "count": created}

# --- Buddy conversational booking ---
def _detect_intent(message: str) -> str:
    text = (message or "").strip().lower()
    if text in {"__start__", "start", "hi", "hello", "hey", "namaste", "namaskaram"}:
        return "greet"

    book_words = [
        "book", "confirm", "proceed", "yes", "go ahead", "do booking", "auto book", "book now",
        "book karo", "booking karo", "confirm karo", "aage badho",
        "book chey", "booking chey", "confirm chey", "munduku", "ippude book",
    ]
    list_words = [
        "recommend", "suggest", "show", "options", "furniture", "show recommendations",
        "sujhav", "dikhao", "furniture dikhao",
        "suchanalu", "chuupinchu", "furniture chupinchu",
    ]
    status_words = [
        "status", "bookings", "my booking", "booking status",
        "sthiti", "booking sthiti", "meri booking",
        "sthiti cheppu", "na booking", "booking status cheppu",
    ]

    if any(w in text for w in book_words):
        return "book"
    if any(w in text for w in status_words):
        return "status"
    if any(w in text for w in list_words):
        return "recommend"
    return "chat"


def _reply(lang: str, key: str, **kwargs: Any) -> str:
    templates = {
        "en": {
            "greet": "Hi, I am Buddy. I can explain your design and auto-book recommended furniture. Say 'book now' to continue.",
            "recommend": "Top suggestions: {items}. Say 'book now' and I will confirm available matches.",
            "booked": "Done. I confirmed {count} booking(s): {items}.",
            "book_none": "I could not match catalog items for booking yet. Please seed furniture or refine recommendations.",
            "status": "You currently have {count} booking(s).",
            "chat": "I can help with recommendations, pricing, and booking. Say 'show recommendations' or 'book now'.",
        },
        "hi": {
            "greet": "Namaste, main Buddy hoon. Main design samjha sakta hoon aur furniture auto-book kar sakta hoon. 'book now' boliye.",
            "recommend": "Top sujhav: {items}. Booking ke liye 'book now' boliye.",
            "booked": "Ho gaya. Maine {count} booking confirm ki: {items}.",
            "book_none": "Catalog match nahin mila. Furniture seed kijiye ya suggestions update kijiye.",
            "status": "Aapki total booking: {count}.",
            "chat": "Main sujhav, pricing aur booking mein madad kar sakta hoon. 'show recommendations' ya 'book now' boliye.",
        },
        "te": {
            "greet": "Namaskaram, nenu Buddy ni. Nenu design explain chesi furniture auto-book chestanu. 'book now' ani cheppandi.",
            "recommend": "Mukhya sujhanalu: {items}. Booking kosam 'book now' ani cheppandi.",
            "booked": "Aipoyindi. Nenu {count} booking confirm chesanu: {items}.",
            "book_none": "Catalog lo match dorakaledu. Mundu furniture seed cheyyandi leda suggestions update cheyyandi.",
            "status": "Mee total bookings: {count}.",
            "chat": "Nenu recommendations, pricing, booking lo help chestanu. 'show recommendations' leda 'book now' ani cheppandi.",
        },
    }

    table = templates.get(lang, templates["en"])
    template = table.get(key, templates["en"]["chat"])
    return template.format(**kwargs)


def _buddy_actions(lang: str) -> list[str]:
    return ["show recommendations", "book now"]

@app.post("/buddy/chat", response_model=BuddyChatResponse)
def buddy_chat(payload: BuddyChatRequest, db: Session = Depends(get_db), current_user: Optional[User] = Depends(get_current_user_optional)):
    lang = payload.lang if payload.lang in {"en", "hi", "te"} else "en"

    design = db.query(Design).filter(Design.id == payload.design_id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")

    if current_user and design.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this design")

    ai_output = design.ai_output or {}
    recs = ai_output.get("furniture_recommendations") or []
    matched_items = _matched_catalog_items_for_design(db, design)
    matched_names = [item.name for item in matched_items]
    rec_text = ", ".join(matched_names[:5]) if matched_names else "No catalog-matched items yet"
    available_catalog = db.query(Furniture).all()
    if not available_catalog:
        _seed_default_furniture(db)
        available_catalog = db.query(Furniture).all()
    available_text = ", ".join([item.name for item in available_catalog[:5]]) if available_catalog else "No catalog items available"

    intent = _detect_intent(payload.message)
    active_user_id = (
        current_user.id
        if current_user
        else (payload.user_id if payload.user_id and payload.user_id > 0 else design.user_id)
    )

    if intent == "greet":
        return BuddyChatResponse(
            reply=_reply(lang, "greet"),
            action="greet",
            lang=lang,
            suggested_actions=_buddy_actions(lang),
            recommendations=recs,
            bookings=[],
        )

    if intent == "recommend":
        return BuddyChatResponse(
            reply=_reply(lang, "recommend", items=rec_text),
            action="recommend",
            lang=lang,
            suggested_actions=_buddy_actions(lang),
            recommendations=recs,
            bookings=[],
        )

    if intent == "book" and payload.auto_book:
        bookings = _auto_book_from_design(db, design, booking_user_id=active_user_id)
        if bookings:
            booked_items = []
            booking_payloads = []
            for b in bookings:
                item = db.query(Furniture).filter(Furniture.id == b.furniture_id).first()
                if item:
                    booked_items.append(f"{item.name} ({_format_price_inr(item.price)})")
                booking_payloads.append(_booking_to_out(b, db))
            items_text = ", ".join(booked_items) if booked_items else "catalog items"
            return BuddyChatResponse(
                reply=_reply(lang, "booked", count=len(bookings), items=items_text),
                action="booked",
                lang=lang,
                suggested_actions=_buddy_actions(lang),
                recommendations=recs,
                bookings=booking_payloads,
            )

        return BuddyChatResponse(
            reply=_reply(lang, "book_none") + f" Available catalog: {available_text}.",
            action="book_none",
            lang=lang,
            suggested_actions=_buddy_actions(lang),
            recommendations=recs,
            bookings=[],
        )

    if intent == "status":
        booking_count = db.query(Booking).filter(Booking.user_id == active_user_id).count()
        return BuddyChatResponse(
            reply=_reply(lang, "status", count=booking_count),
            action="status",
            lang=lang,
            suggested_actions=_buddy_actions(lang),
            recommendations=recs,
            bookings=[],
        )

    return BuddyChatResponse(
        reply=_reply(lang, "chat"),
        action="chat",
        lang=lang,
        suggested_actions=_buddy_actions(lang),
        recommendations=recs,
        bookings=[],
    )










































