import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from routes import user as user_routes


@pytest.fixture()
def client(monkeypatch):
    """
    A fully-wired TestClient whose DB-dependent calls are monkey-patched
    so the API layer can be tested in isolation.
    """
    app = FastAPI()
    app.include_router(user_routes.router)

    # ---------- stub helpers ----------
    monkeypatch.setattr(
        user_routes, "register_user",
        lambda data: {"message": "User registered successfully"},
    )
    monkeypatch.setattr(
        user_routes, "login_user",
        lambda data: {"message": "Login successful", "user_id": 42},
    )
    monkeypatch.setattr(
        user_routes, "toggle_favorite",
        lambda *_, **__: {"message": "Favorite added", "success": True},
    )
    monkeypatch.setattr(
        user_routes, "get_user_favorites",
        lambda uid: ["SUP123"],
    )
    monkeypatch.setattr(
        user_routes, "check_is_favorite",
        lambda uid, sid: {"is_favorite": True},
    )
    monkeypatch.setattr(
        user_routes, "get_popular_suppliers",
        lambda: [{"supplier_id": "SUP123", "count": 10}],
    )
    monkeypatch.setattr(
        user_routes, "submit_complaint",
        lambda *_, **__: {"message": "Complaint submitted successfully",
                          "success": True},
    )
    monkeypatch.setattr(
        user_routes, "get_user_complaints",
        lambda uid: [{"id": 1, "text": "test", "supplier_id": None,
                      "created_at": "now", "status": "pending"}],
    )
    monkeypatch.setattr(
        user_routes, "get_supplier_details",
        lambda sid: {"id": sid, "name": "Test Co", "category": "A"},
    )
    monkeypatch.setattr(
        user_routes, "update_profile",
        lambda *_, **__: {"message": "Profile updated successfully",
                          "user_id": 42, "email": "new@test.com"},
    )
    monkeypatch.setattr(
        user_routes, "submit_rating",
        lambda data: {"message": "Rating submitted successfully",
                      "success": True},
    )
    monkeypatch.setattr(
        user_routes, "get_user_rating",
        lambda uid, sid: {"rating": 4},
    )
    monkeypatch.setattr(
        user_routes, "calculate_bulk_average_ratings",
        lambda ids: [{"supplier_id": ids[0],
                      "average_rating": 4.5, "count": 2}],
    )
    # ---------- ready ----------
    return TestClient(app)
