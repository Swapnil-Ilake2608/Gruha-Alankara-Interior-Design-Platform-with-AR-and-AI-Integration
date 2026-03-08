"""Milestone validation script for Gruha Alankara.

Validates:
- DB schema existence
- CRUD for user/design/furniture/booking
- API smoke endpoints (/ and /health/ready)
"""

from __future__ import annotations

import json
import os
import sys

# Ensure local imports work when executing as a script from backend/scripts.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from dataclasses import dataclass, asdict

from fastapi.testclient import TestClient
from sqlalchemy import inspect

# Keep AI checks local/fallback during validation.
os.environ.setdefault("AI_PROVIDER", "local")

from app.database import SessionLocal, engine
from app.models import Booking, Design, DesignAnalysisCache, Furniture, User
from main import app


@dataclass
class CheckResult:
    name: str
    passed: bool
    detail: str


def check_schema() -> CheckResult:
    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    expected = {"users", "designs", "furniture", "bookings", "design_analysis_cache"}
    missing = sorted(expected - tables)
    if missing:
        return CheckResult("schema", False, f"Missing tables: {', '.join(missing)}")
    return CheckResult("schema", True, "All required tables exist")


def check_crud() -> CheckResult:
    db = SessionLocal()
    try:
        user = User(username="qa_user", email="qa_user@example.com", password_hash="hash")
        db.add(user)
        db.flush()

        design = Design(
            image_path="uploads/qa.jpg",
            style_theme="Modern",
            user_id=user.id,
            ai_output={"furniture_recommendations": [{"item": "Bed", "style": "Modern", "color": "#FFFFFF"}]},
        )
        db.add(design)
        db.flush()

        furniture = Furniture(name="Bed", category="Bedroom", price=10000, image_url="https://example.com/bed.jpg")
        db.add(furniture)
        db.flush()

        booking = Booking(user_id=user.id, design_id=design.id, furniture_id=furniture.id, status="confirmed")
        db.add(booking)
        db.commit()

        found = db.query(Booking).filter(Booking.id == booking.id).first()
        if not found:
            return CheckResult("crud", False, "Booking read failed")

        found.status = "completed"
        db.commit()

        db.delete(found)
        db.delete(furniture)
        db.delete(design)
        db.delete(user)
        db.commit()

        return CheckResult("crud", True, "Create/Read/Update/Delete successful")
    except Exception as exc:
        db.rollback()
        return CheckResult("crud", False, f"CRUD failed: {exc}")
    finally:
        db.close()


def check_api_smoke() -> CheckResult:
    client = TestClient(app)
    root = client.get("/")
    ready = client.get("/health/ready")

    if root.status_code != 200:
        return CheckResult("api_smoke", False, f"GET / failed with {root.status_code}")
    if ready.status_code != 200:
        return CheckResult("api_smoke", False, f"GET /health/ready failed with {ready.status_code}")

    return CheckResult("api_smoke", True, "Core API health endpoints are reachable")


def check_cache_table_writable() -> CheckResult:
    db = SessionLocal()
    try:
        row = DesignAnalysisCache(
            input_hash="qa-hash-1",
            style_theme="Modern",
            lang="en",
            room_fingerprint="qa",
            ai_output={"ok": True},
        )
        db.add(row)
        db.commit()
        db.delete(row)
        db.commit()
        return CheckResult("cache", True, "Design analysis cache table is writable")
    except Exception as exc:
        db.rollback()
        return CheckResult("cache", False, f"Cache write failed: {exc}")
    finally:
        db.close()


def main() -> None:
    checks = [
        check_schema(),
        check_crud(),
        check_cache_table_writable(),
        check_api_smoke(),
    ]

    summary = {
        "checks": [asdict(c) for c in checks],
        "passed": sum(1 for c in checks if c.passed),
        "total": len(checks),
    }
    summary["score_percent"] = round((summary["passed"] / summary["total"]) * 100, 2)

    print(json.dumps(summary, indent=2))

    if summary["passed"] != summary["total"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

