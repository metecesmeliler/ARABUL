import pytest
import requests
import services.distance_duration_service as es

from services.distance_duration_service import (
    get_lat_lng,
    get_location_osm_backup,
    get_distance_matrix,
    format_duration,
    sort_suppliers,
    process_suppliers,
)

# -- Helpers --------------------------------------------------------------

class DummyResponse:
    def __init__(self, status_code, json_data):
        self.status_code = status_code
        self._json = json_data

    def json(self):
        return self._json

    def raise_for_status(self):
        if self.status_code != 200:
            raise requests.exceptions.RequestException(f"HTTP {self.status_code}")

# -- get_lat_lng tests ----------------------------------------------------

def test_get_lat_lng_success(monkeypatch):
    data = {
        "status": "OK",
        "results": [{"geometry": {"location": {"lat": 10.1, "lng": 20.2}}}]
    }
    def fake_get(url, params, timeout):
        return DummyResponse(200, data)

    monkeypatch.setattr(requests, "get", fake_get)
    coords = get_lat_lng("123 Main St")
    assert coords == {"latitude": 10.1, "longitude": 20.2}

def test_get_lat_lng_zero_results_uses_fallback(monkeypatch):
    data = {"status": "ZERO_RESULTS"}
    def fake_get(url, params, timeout):
        return DummyResponse(200, data)

    monkeypatch.setattr(requests, "get", fake_get)
    # stub out the OSM backup
    monkeypatch.setattr(es, "get_location_osm_backup",
                        lambda addr: {"latitude": 1.1, "longitude": 2.2})

    coords = get_lat_lng("Nowhere")
    assert coords == {"latitude": 1.1, "longitude": 2.2}

def test_get_lat_lng_exception_returns_none(monkeypatch):
    def fake_get(url, params, timeout):
        raise requests.exceptions.RequestException("timeout")

    monkeypatch.setattr(requests, "get", fake_get)
    assert get_lat_lng("Fail St") is None

# -- get_location_osm_backup tests ----------------------------------------

def test_get_location_osm_backup_success(monkeypatch):
    data = [{"lat": "33.3", "lon": "44.4"}]
    def fake_get(url, headers, timeout):
        return DummyResponse(200, data)

    monkeypatch.setattr(requests, "get", fake_get)
    coords = get_location_osm_backup("Somewhere")
    assert coords == {"latitude": 33.3, "longitude": 44.4}

def test_get_location_osm_backup_exception_returns_none(monkeypatch):
    def fake_get(url, headers, timeout):
        raise requests.exceptions.RequestException("error")

    monkeypatch.setattr(requests, "get", fake_get)
    assert get_location_osm_backup("Broken") is None

# -- format_duration tests ------------------------------------------------

def test_format_duration_only_minutes():
    assert format_duration(30) == "0 dakika"

def test_format_duration_hours_and_minutes():
    # 1h 1m = 3660s
    assert format_duration(3660) == "1 saat 1 dakika"

# -- sort_suppliers tests --------------------------------------------------

def test_sort_suppliers_mixes_none_and_zero():
    suppliers = [
        {"name": "A", "distance_km": 5},
        {"name": "B", "distance_km": None},
        {"name": "C", "distance_km": 2},
        {"name": "D", "distance_km": 0}
    ]
    sorted_list = sort_suppliers(suppliers.copy())
    assert [s["name"] for s in sorted_list] == ["C", "A", "B", "D"]

# -- get_distance_matrix tests --------------------------------------------

def test_get_distance_matrix_no_valid_coords(monkeypatch):
    # All get_lat_lng return None → function filters out all suppliers
    suppliers = [{"Address": "X"}]
    monkeypatch.setattr(es, "get_lat_lng", lambda addr: None)
    result = get_distance_matrix(0.0, 0.0, suppliers.copy())
    assert result == []

def test_get_distance_matrix_success(monkeypatch):
    suppliers = [
        {"Address": "Addr1"},
        {"Address": "Addr2"}
    ]
    # stub lat/lng
    monkeypatch.setattr(es, "get_lat_lng", lambda addr: {"latitude": 1.0, "longitude": 2.0})

    # stub Google Routes response
    rows = [
        {"destinationIndex": 0, "distanceMeters": 1500, "duration": "3600s"},
        {"destinationIndex": 1, "distanceMeters":  500, "duration": "   300s"}
    ]
    def fake_post(url, headers, json, timeout):
        return DummyResponse(200, rows)

    monkeypatch.setattr(requests, "post", fake_post)

    out = get_distance_matrix(10.0, 20.0, suppliers.copy())
    # distances in km
    assert out[0]["distance_km"] == pytest.approx(1.5)
    assert out[0]["duration"] == "1 saat 0 dakika"
    assert out[1]["distance_km"] == pytest.approx(0.5)
    # 300s -> 0 saat 5 dakika
    assert out[1]["duration"] == "5 dakika"

# -- process_suppliers tests -----------------------------------------------

def test_process_suppliers_delegates(monkeypatch):
    # stub both helper functions
    monkeypatch.setattr(es, "get_distance_matrix",
                        lambda ulat, ulng, sup: [{"foo": "bar"}])
    monkeypatch.setattr(es, "sort_suppliers",
                        lambda sup: sup)

    # supply a list form
    data_list = [{"Suppliers": [{"id": 1}]}]
    result = process_suppliers(0.0, 0.0, data_list)

    # process_suppliers wraps list into {"data": ...}
    assert "data" in result
    assert isinstance(result["data"], list)
    assert result["data"][0]["Suppliers"] == [{"foo": "bar"}]
