import requests
import concurrent.futures
import time
from typing import List, Dict, Union
from functools import lru_cache
from config import GOOGLE_API_KEY
import re


@lru_cache(maxsize=1000)
def get_lat_lng(address: str) -> Dict[str, float]:
    address = re.sub(r"[^a-zA-Z0-9 ]", "", address.strip().lower())  # normalize for caching
    start = time.time()

    geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": address,
        "key": GOOGLE_API_KEY,
        "region": "cy",
        "components": "country:CY",
    }

    try:
        response = requests.get(geocode_url, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()

        if data.get("status") == "OK":
            location = data["results"][0]["geometry"]["location"]
            print(f"get_lat_lng resolved '{address}' via Google in {round(time.time() - start, 2)} sec")
            return {"latitude": location["lat"], "longitude": location["lng"]}
        else:
            print(f"Google Geocoding returned no results for: '{address}', falling back to OSM.")
            fallback = get_location_osm_backup(address)
            if fallback:
                return fallback
            else:
                print(f"OSM fallback also failed for address: {address}")
                return None
    except requests.exceptions.RequestException as e:
        print(f"Google Geocoding API Error: {e}")
        return None

"""
Dummy Function for test purposes
@lru_cache(maxsize=1000)
def get_lat_lng(address: str) -> Dict[str, float]:
    return {"latitude": 35.1856, "longitude": 33.3823}
"""


@lru_cache(maxsize=1000)
def get_location_osm_backup(address: str) -> Dict[str, float]:
    """
    Resolves an address to latitude and longitude using OpenStreetMap Nominatim API.
    Uses cache to prevent repeated external calls.
    """
    start = time.time()
    url = f"https://nominatim.openstreetmap.org/search?q={address}&format=json&limit=1"
    headers = {"User-Agent": "AraBul-Location-Service"}

    try:
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        data = response.json()
        if data:
            print(f"get_location_osm_backup resolved '{address}' via OSM in {round(time.time() - start, 2)} sec")
            return {"latitude": float(data[0]["lat"]), "longitude": float(data[0]["lon"])}
    except requests.exceptions.RequestException as e:
        print(f"OSM API Error: {e}")

    return None


def get_distance_matrix(user_lat: float, user_lng: float, suppliers: List[Dict]) -> List[Dict]:
    start = time.time()

    base_url = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "originIndex,destinationIndex,distanceMeters,duration"
    }

    # Resolve coordinates in parallel
    with concurrent.futures.ThreadPoolExecutor(max_workers=60) as executor:
        future_results = {executor.submit(get_lat_lng, s["Address"]): s for s in suppliers}
        for future in concurrent.futures.as_completed(future_results):
            coords = future.result()
            if coords:
                future_results[future].update(coords)

    # Remove suppliers with missing coordinates
    suppliers = [s for s in suppliers if "latitude" in s and "longitude" in s]
    if not suppliers:
        print("No valid suppliers found with latitude/longitude.")
        return []

    # Prepare Google Routes API request
    destinations = [
        {"waypoint": {"location": {"latLng": {"latitude": s["latitude"], "longitude": s["longitude"]}}}}
        for s in suppliers
    ]

    payload = {
        "origins": [{"waypoint": {"location": {"latLng": {"latitude": user_lat, "longitude": user_lng}}}}],
        "destinations": destinations,
        "travelMode": "DRIVE"
    }

    try:
        response = requests.post(base_url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()

        if "error" in data or not isinstance(data, list):
            print("Google Routes API Error:", data)
            return suppliers

        for i, row in enumerate(data):
            if "destinationIndex" in row and row["destinationIndex"] < len(suppliers):
                suppliers[row["destinationIndex"]].update({
                    "distance_km": row.get("distanceMeters", 0) / 1000,
                    "duration": format_duration(int(row.get("duration", "0s").replace("s", "")))
                })
    except requests.exceptions.RequestException as e:
        print(f"Google Routes API Error: {e}")

    print("get_distance_matrix latency:", round(time.time() - start, 2), "sec")
    return suppliers

"""
Test purpose
def get_distance_matrix(user_lat: float, user_lng: float, suppliers: List[Dict], chunk_size: int = 25) -> List[Dict]:
    for s in suppliers:
        s["distance_km"] = 1.0
        s["duration"] = "5 dakika"
    return suppliers
"""

def format_duration(seconds: int) -> str:
    """
    Converts duration in seconds to a human-readable hour and minute string.
    """
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    return f"{hours} saat {minutes} dakika" if hours > 0 else f"{minutes} dakika"


def sort_suppliers(suppliers: List[Dict]) -> List[Dict]:
    with_distance = [s for s in suppliers if s.get("distance_km") not in [None, 0]]
    without_distance = [s for s in suppliers if s.get("distance_km") in [None, 0]]
    with_distance.sort(key=lambda x: x["distance_km"])
    return with_distance + without_distance




def process_suppliers(user_lat: float, user_lng: float, supplier_data: Union[Dict, List]) -> Dict:
    """
    Enriches and sorts supplier data by computing distances from the user.
    """
    if isinstance(supplier_data, list):
        supplier_data = {"data": supplier_data}

    for sector in supplier_data.get("data", []):
        sector["Suppliers"] = get_distance_matrix(user_lat, user_lng, sector["Suppliers"])
        sector["Suppliers"] = sort_suppliers(sector["Suppliers"])

    return supplier_data
