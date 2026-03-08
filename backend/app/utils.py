import hashlib
import json
import os
import tempfile
import uuid
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from datetime import datetime, timedelta
from io import BytesIO

import bcrypt
from jose import jwt

from .config import settings

try:
    from groq import Groq
except Exception:
    Groq = None

try:
    from gtts import gTTS
except Exception:
    gTTS = None

try:
    from PIL import Image
except Exception:
    Image = None

try:
    from ibm_watsonx_ai.foundation_models import ModelInference
except Exception:
    ModelInference = None

try:
    from transformers import pipeline
except Exception:
    pipeline = None

try:
    from langchain_core.prompts import ChatPromptTemplate
except Exception:
    ChatPromptTemplate = None

try:
    import imageio.v3 as iio
except Exception:
    iio = None

try:
    import numpy as np
except Exception:
    np = None


_groq_client = Groq(api_key=settings.GROQ_API_KEY) if (Groq and settings.GROQ_API_KEY) else None
_cv_classifier = None


# --- Auth Utilities ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# --- Image + Cache Helpers ---
def compute_input_hash(content: bytes, theme: str, lang: str) -> str:
    hasher = hashlib.sha256()
    hasher.update(b"cache-v2")
    hasher.update(content)
    hasher.update(theme.encode("utf-8"))
    hasher.update(lang.encode("utf-8"))
    return hasher.hexdigest()


def _load_cv_classifier():
    global _cv_classifier
    if _cv_classifier is not None:
        return _cv_classifier
    if not settings.ENABLE_TRANSFORMERS_CV or not pipeline:
        return None

    try:
        _cv_classifier = pipeline("image-classification", model="google/vit-base-patch16-224")
    except Exception:
        _cv_classifier = None
    return _cv_classifier


def _infer_room_type_with_transformers(image) -> str | None:
    classifier = _load_cv_classifier()
    if not classifier:
        return None

    try:
        results = classifier(image)
        if not results:
            return None
        top = (results[0].get("label") or "").lower()
        if any(k in top for k in ["bedroom", "bed"]):
            return "bedroom_or_study"
        if any(k in top for k in ["living", "sofa", "couch", "lounge"]):
            return "living_room"
        if any(k in top for k in ["corridor", "hallway"]):
            return "corridor_or_bedroom"
    except Exception:
        return None

    return None


def _fallback_room_analysis(source: str = "fallback") -> dict:
    return {
        "analysis_version": "v2",
        "source": source,
        "room_type": "generic",
        "image_size": {"width": 0, "height": 0},
        "aspect_ratio": 1.0,
        "brightness": "medium",
        "dominant_colors": ["#334155", "#64748B", "#CBD5E1"],
        "placement_zones": ["center", "left", "right"],
        "room_fingerprint": "generic-medium-1.0",
    }


def _analyze_pil_image(image, source_tag: str) -> dict:
    width, height = image.size
    aspect_ratio = round(width / max(height, 1), 2)

    gray = image.convert("L")
    mean_brightness = sum(gray.getdata()) / max(width * height, 1)
    if mean_brightness < 85:
        brightness = "dark"
    elif mean_brightness < 170:
        brightness = "medium"
    else:
        brightness = "bright"

    palette_image = image.resize((128, 128)).quantize(colors=5)
    palette = palette_image.getpalette() or []
    color_counts = sorted(palette_image.getcolors() or [], reverse=True)
    dominant = []
    for _, idx in color_counts[:3]:
        start = idx * 3
        rgb = palette[start:start + 3]
        if len(rgb) == 3:
            dominant.append("#{:02X}{:02X}{:02X}".format(rgb[0], rgb[1], rgb[2]))

    if not dominant:
        dominant = ["#334155", "#64748B", "#CBD5E1"]

    heuristic_room = "bedroom_or_study"
    if aspect_ratio > 1.6:
        heuristic_room = "living_room"
    elif aspect_ratio < 0.9:
        heuristic_room = "corridor_or_bedroom"

    transformer_room = _infer_room_type_with_transformers(image)
    room_type = transformer_room or heuristic_room

    zones = ["center"]
    if width >= height:
        zones.extend(["left", "right"])
    else:
        zones.extend(["front", "back"])

    room_fingerprint = f"{room_type}-{brightness}-{aspect_ratio}"

    return {
        "analysis_version": "v2",
        "source": f"transformers+{source_tag}" if transformer_room else source_tag,
        "room_type": room_type,
        "image_size": {"width": width, "height": height},
        "aspect_ratio": aspect_ratio,
        "brightness": brightness,
        "dominant_colors": dominant,
        "placement_zones": zones,
        "room_fingerprint": room_fingerprint,
    }


def analyze_room_image(content: bytes) -> dict:
    if not Image:
        return _fallback_room_analysis("fallback-no-pillow")

    image = Image.open(BytesIO(content)).convert("RGB")
    return _analyze_pil_image(image, source_tag="pillow-heuristic")


def _extract_video_frame(video_content: bytes, extension: str):
    if not (Image and iio and np is not None):
        return None

    suffix = f".{extension}" if extension else ".mp4"
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_video:
            temp_video.write(video_content)
            temp_path = temp_video.name

        frame = None
        for idx, candidate in enumerate(iio.imiter(temp_path)):
            frame = candidate
            if idx >= 10:
                break

        if frame is None:
            return None

        if frame.ndim == 2:
            return Image.fromarray(frame).convert("RGB")

        if frame.ndim == 3 and frame.shape[2] >= 3:
            rgb = frame[:, :, :3]
            return Image.fromarray(rgb.astype("uint8"), "RGB")

        return None
    except Exception:
        return None
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


def analyze_room_media(content: bytes, extension: str) -> dict:
    ext = (extension or "").lower().strip(".")
    if ext in settings.ALLOWED_IMAGE_EXTENSIONS:
        return analyze_room_image(content)

    if ext in settings.ALLOWED_VIDEO_EXTENSIONS:
        frame_image = _extract_video_frame(content, ext)
        if frame_image is not None:
            return _analyze_pil_image(frame_image, source_tag="video-keyframe")
        return _fallback_room_analysis("video-fallback")

    return _fallback_room_analysis("unsupported-media")
# --- AI Suggestion Engine ---
def _target_language(lang: str) -> str:
    lang_map = {"en": "English", "hi": "Hindi", "mr": "Marathi", "te": "Telugu"}
    return lang_map.get(lang, "English")


def _build_prompt(theme: str, target_lang: str, room_analysis: dict) -> str:
    room_type = room_analysis.get("room_type", "generic room")
    zones = room_analysis.get("placement_zones", ["center", "left", "right"])
    colors = room_analysis.get("dominant_colors", ["#334155", "#64748B", "#CBD5E1"])
    brightness = room_analysis.get("brightness", "medium")

    if settings.ENABLE_LANGCHAIN_PROMPTS and ChatPromptTemplate:
        prompt_template = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You are Buddy, an interior designer. Reply in {target_lang}. Output strict JSON only.",
                ),
                (
                    "human",
                    (
                        "Create design for a {theme} {room_type}. Brightness: {brightness}. "
                        "Dominant colors: {colors}. "
                        "Return JSON with keys: theme_applied, color_palette, furniture_recommendations, "
                        "lighting_suggestion, placement_suggestions, ar_overlay. "
                        "furniture_recommendations must be objects with item/style/color. "
                        "Use zones: {zones}."
                    ),
                ),
            ]
        )
        msgs = prompt_template.format_messages(
            target_lang=target_lang,
            theme=theme,
            room_type=room_type,
            brightness=brightness,
            colors=colors,
            zones=zones,
        )
        return "\n".join([f"{m.type}: {m.content}" for m in msgs])

    return (
        f"Generate a concise interior design JSON for a {theme} {room_type}. "
        f"Reply only in {target_lang}. Brightness={brightness}, colors={colors}. "
        "Return keys: theme_applied, color_palette, furniture_recommendations, lighting_suggestion, "
        "placement_suggestions, ar_overlay."
    )


def _coerce_furniture_recommendations(raw: object, theme: str, colors: list[str]) -> list[dict]:
    def to_rec(obj: object) -> dict | None:
        if isinstance(obj, dict):
            item = obj.get("item") or obj.get("name") or obj.get("furniture") or obj.get("title")
            style = obj.get("style") or obj.get("theme") or theme
            color = obj.get("color") or obj.get("shade") or obj.get("finish") or (colors[0] if colors else "Neutral")
            if item:
                return {"item": str(item), "style": str(style), "color": str(color)}
            return None
        if isinstance(obj, str) and obj.strip():
            return {"item": obj.strip(), "style": theme, "color": colors[0] if colors else "Neutral"}
        return None

    entries: list[object] = []
    if isinstance(raw, list):
        entries = raw
    elif isinstance(raw, dict):
        for key in ("items", "recommendations", "furniture", "furniture_recommendations"):
            if isinstance(raw.get(key), list):
                entries = raw[key]
                break
        if not entries:
            entries = list(raw.values())

    return [rec for rec in (to_rec(item) for item in entries) if rec]


def _default_recommendations(theme: str, room_analysis: dict) -> list[dict]:
    room_type = room_analysis.get("room_type", "generic")
    colors = room_analysis.get("dominant_colors", ["#334155", "#64748B", "#CBD5E1"])

    if room_type == "living_room":
        items = ["Sectional Sofa", "Center Table", "Accent Lamp"]
    elif room_type == "corridor_or_bedroom":
        items = ["Wardrobe Unit", "Bedside Table", "Wall Sconce"]
    else:
        items = ["Bed", "Study Desk", "Bookshelf"]

    return [
        {"item": items[0], "style": theme, "color": colors[0]},
        {"item": items[1], "style": theme, "color": colors[1] if len(colors) > 1 else colors[0]},
        {"item": items[2], "style": theme, "color": colors[2] if len(colors) > 2 else colors[0]},
    ]


def _normalize_ai_payload(theme: str, room_analysis: dict, payload: dict) -> dict:
    zones = room_analysis.get("placement_zones", ["center", "left", "right"])
    base_colors = room_analysis.get("dominant_colors", ["#1E293B", "#7C3AED", "#F8FAFC"])

    palette = payload.get("color_palette") if isinstance(payload.get("color_palette"), list) else base_colors
    furniture = _coerce_furniture_recommendations(payload.get("furniture_recommendations"), theme, base_colors)
    if not furniture:
        furniture = _default_recommendations(theme, room_analysis)

    lighting = payload.get("lighting_suggestion")
    if not isinstance(lighting, str) or not lighting.strip():
        brightness = room_analysis.get("brightness", "medium")
        if brightness == "dark":
            lighting = "Use layered warm lighting with two floor lamps and one ceiling diffuser."
        elif brightness == "bright":
            lighting = "Use soft indirect evening lighting to balance natural daylight."
        else:
            lighting = "Use layered lighting with warm ambient lamps and focused task lighting."

    return {
        "theme_applied": payload.get("theme_applied", theme),
        "color_palette": palette,
        "furniture_recommendations": furniture,
        "lighting_suggestion": lighting,
        "placement_suggestions": payload.get("placement_suggestions")
        or [
            {"zone": zones[0], "item": furniture[0]["item"], "rationale": "Keeps circulation clear."},
            {"zone": zones[min(1, len(zones) - 1)], "item": furniture[1]["item"], "rationale": "Improves functional balance."},
            {"zone": zones[min(2, len(zones) - 1)], "item": furniture[2]["item"], "rationale": "Adds depth and ambience."},
        ],
        "ar_overlay": payload.get("ar_overlay")
        or [
            {"item": furniture[0]["item"], "anchor": zones[0], "x": 0.5, "y": 0.0, "z": 0.6, "scale": 1.0, "rotation_deg": 0},
            {"item": furniture[1]["item"], "anchor": zones[min(1, len(zones) - 1)], "x": 0.3, "y": 0.0, "z": 0.45, "scale": 0.8, "rotation_deg": 10},
        ],
        "room_analysis": room_analysis,
    }


def _local_fallback(theme: str, room_analysis: dict) -> dict:
    return _normalize_ai_payload(theme, room_analysis, payload={})


def _call_groq(theme: str, lang: str, room_analysis: dict) -> dict:
    if not _groq_client:
        raise RuntimeError("Groq client unavailable. Configure GROQ_API_KEY.")
    target_lang = _target_language(lang)
    user_prompt = _build_prompt(theme, target_lang, room_analysis)
    response = _groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": "You are Buddy. Return strict JSON only."},
            {"role": "user", "content": user_prompt},
        ],
    )
    return json.loads(response.choices[0].message.content)


def _call_ibm(theme: str, lang: str, room_analysis: dict, model_id: str) -> dict:
    if not ModelInference:
        raise RuntimeError("IBM watsonx client unavailable.")
    if not settings.WATSONX_API_KEY or not settings.PROJECT_ID:
        raise RuntimeError("Configure WATSONX_API_KEY and PROJECT_ID.")

    credentials = {"url": "https://jp-tok.ml.cloud.ibm.com", "apikey": settings.WATSONX_API_KEY}
    model = ModelInference(
        model_id=model_id,
        credentials=credentials,
        project_id=settings.PROJECT_ID,
        params={"decoding_method": "sample", "temperature": 0.6, "max_new_tokens": 500},
    )

    target_lang = _target_language(lang)
    response_text = model.generate_text(prompt=_build_prompt(theme, target_lang, room_analysis))
    start = response_text.find("{")
    end = response_text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("IBM response did not contain JSON.")
    return json.loads(response_text[start : end + 1])


def _call_ai_provider(theme: str, lang: str, room_analysis: dict) -> dict:
    provider = (settings.AI_PROVIDER or "ibm_granite").lower()
    if provider == "ibm_granite":
        return _call_ibm(theme, lang, room_analysis, settings.IBM_GRANITE_MODEL_ID)
    if provider == "ibm":
        return _call_ibm(theme, lang, room_analysis, "meta-llama/llama-3-3-70b-instruct")
    if provider == "groq":
        return _call_groq(theme, lang, room_analysis)
    return _local_fallback(theme, room_analysis)


def generate_ai_design_suggestions(theme: str, lang: str = "en", room_analysis: dict | None = None) -> dict:
    room_analysis = room_analysis or {}
    attempts = max(settings.AI_RETRIES + 1, 1)
    last_error = None

    for _ in range(attempts):
        try:
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_call_ai_provider, theme, lang, room_analysis)
                payload = future.result(timeout=settings.AI_TIMEOUT_SECONDS)
            return _normalize_ai_payload(theme, room_analysis, payload)
        except FuturesTimeoutError:
            last_error = "AI request timed out"
        except Exception as exc:
            last_error = str(exc)

    fallback = _local_fallback(theme, room_analysis)
    fallback["model_error"] = last_error or "AI unavailable"
    return fallback


# --- Buddy Voice Agent ---
def _voice_text(design_data: dict, lang: str) -> str:
    ai_tip = design_data.get("lighting_suggestion", "")
    style = design_data.get("theme_applied", "Modern")

    greetings = {
        "en": f"Hi, I am Buddy. For your {style} room: ",
        "hi": f"Namaste, main Buddy hoon. Aapke {style} room ke liye: ",
        "mr": f"Namaskar, mi Buddy aahe. Tumchya {style} room sathi: ",
        "te": f"Namaskaram, nenu Buddy ni. Mee {style} room kosam: ",
    }
    return greetings.get(lang, greetings["en"]) + ai_tip


def _save_tts(text: str, lang: str) -> str:
    if not gTTS:
        raise RuntimeError("gTTS package unavailable.")
    tts = gTTS(text=text, lang=lang)
    voice_filename = f"buddy_{uuid.uuid4()}.mp3"
    voice_path = os.path.join(settings.UPLOAD_DIR, voice_filename)
    if not os.path.exists(settings.UPLOAD_DIR):
        os.makedirs(settings.UPLOAD_DIR)
    tts.save(voice_path)
    return voice_filename


def generate_buddy_voice(design_data: dict, lang: str = "en"):
    text = _voice_text(design_data, lang)
    attempts = max(settings.TTS_RETRIES + 1, 1)
    last_error = None

    for _ in range(attempts):
        try:
            with ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_save_tts, text, lang)
                return future.result(timeout=settings.TTS_TIMEOUT_SECONDS)
        except Exception as exc:
            last_error = exc

    print(f"Voice Error: {last_error}")
    return None



