import pytest
import requests
from services.external_api_service import (
    fetch_suppliers,
    fetch_suppliers_cached   # we’ll clear its LRU cache each run
)
from config import SUPPLIER_LIST_ENDPOINT


# ──────────── dummy response helper ────────────
class DummyResponse:
    def __init__(self, status_code: int, payload: dict):
        self.status_code = status_code
        self._json       = payload

    # external_api_service calls .json()
    def json(self):
        return self._json

    # and it now calls .raise_for_status()
    def raise_for_status(self):
        if self.status_code >= 400:
            raise requests.exceptions.HTTPError(
                f"{self.status_code} error"
            )


# ──────────── fixtures ────────────
@pytest.fixture(autouse=True)
def clear_cache():
    """Ensure each test starts with an empty LRU cache."""
    fetch_suppliers_cached.cache_clear()
    yield
    fetch_suppliers_cached.cache_clear()


# ──────────── tests ────────────
def test_fetch_suppliers_success(monkeypatch):
    dummy_result = {"success": True, "suppliers": [1, 2, 3]}

    def fake_post(url, json, timeout):
        # Verify endpoint and basic payload shape
        assert url == SUPPLIER_LIST_ENDPOINT
        assert "NaceCodes" in json and isinstance(json["NaceCodes"], list)
        assert "Cities"    in json and isinstance(json["Cities"], list)
        return DummyResponse(200, dummy_result)

    monkeypatch.setattr(requests, "post", fake_post)

    out = fetch_suppliers(["A"], [{"City": "X"}])
    assert out == dummy_result


def test_fetch_suppliers_failure(monkeypatch):
    def fake_post(url, json, timeout):
        # Simulate external API returning HTTP-500
        return DummyResponse(500, {"error": "server down"})

    monkeypatch.setattr(requests, "post", fake_post)

    out = fetch_suppliers(["A"], [{"City": "X"}])
    # When an HTTPError is raised, external_api_service now returns {"data": []}
    assert out == {"data": []}
