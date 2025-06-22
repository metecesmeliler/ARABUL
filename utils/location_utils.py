import requests
from typing import List, Dict, Union
from config import GOOGLE_API_KEY, SUPPLIER_LIST_ENDPOINT


def get_lat_lng(address: str) -> Dict[str, float]:
    """
    Google Geocoding API kullanarak adresi enlem ve boylam koordinatlarına çevirir.
    """
    geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {
        "address": address,
        "key": GOOGLE_API_KEY
    }
    response = requests.get(geocode_url, params=params)
    data = response.json()

    if data.get("status") == "OK":
        location = data["results"][0]["geometry"]["location"]
        return {"latitude": location["lat"], "longitude": location["lng"]}
    else:
        print(f"Geocoding failed for address: {address}")
        return None


def format_duration(seconds: int) -> str:
    """
    Saniye cinsinden süreyi saat ve dakika formatına çevirir.
    """
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    return f"{hours} saat {minutes} dakika" if hours > 0 else f"{minutes} dakika"


def get_distance_matrix(user_lat: float, user_lng: float, suppliers: List[Dict]) -> List[Dict]:
    """
    Google Routes API kullanarak mesafe hesaplar ve enlem-boylam bilgilerini ekler.
    """
    base_url = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "originIndex,destinationIndex,distanceMeters,duration"
    }

    # Tedarikçilerin enlem ve boylam bilgilerini al
    for supplier in suppliers:
        coords = get_lat_lng(supplier["Address"])
        if coords:
            supplier.update(coords)

    destinations = [
        {"waypoint": {"location": {"latLng": {"latitude": supplier["latitude"], "longitude": supplier["longitude"]}}}}
        for supplier in suppliers if "latitude" in supplier and "longitude" in supplier
    ]

    if not destinations:
        print("No valid destinations found.")
        return suppliers

    payload = {
        "origins": [{"waypoint": {"location": {"latLng": {"latitude": user_lat, "longitude": user_lng}}}}],
        "destinations": destinations,
        "travelMode": "DRIVE"
    }

    response = requests.post(base_url, headers=headers, json=payload)
    data = response.json()

    if "error" in data or not isinstance(data, list):
        print("Google API Error:", data)
        return suppliers

    for i, row in enumerate(data):
        if "destinationIndex" in row and row["destinationIndex"] < len(suppliers):
            suppliers[row["destinationIndex"]].update({
                "distance_km": row.get("distanceMeters", 0) / 1000,  # Mesafeyi km'ye çevir
                "duration": format_duration(int(row.get("duration", "0s").replace("s", "")))
                # Süreyi saat/dakika olarak formatla
            })

    return suppliers


def fetch_suppliers(nace_codes: List[str], cities: List[dict]) -> Dict:
    """
    Dış API'den tedarikçileri getirir ve mesafe ile koordinat bilgilerini ekler.
    """
    payload = {
        "NaceCodes": [{"NaceCode": code} for code in nace_codes],
        "Cities": [{"City": city["City"], "Regions": []} for city in cities],
        "NoofResults": 3,
        "Page": 1
    }
    response = requests.post(SUPPLIER_LIST_ENDPOINT, json=payload)
    suppliers_data = response.json() if response.status_code == 200 else None

    return suppliers_data


def process_suppliers(user_lat: float, user_lng: float, supplier_data: Union[Dict, List]) -> Dict:
    """
    Dış API'den dönen veriye mesafe ve konum bilgilerini ekleyerek sıralar.
    """
    if isinstance(supplier_data, list):
        supplier_data = {"data": supplier_data}  # Eğer list geldiyse, sözlüğe çevir

    for sector in supplier_data.get("data", []):
        sector["Suppliers"] = get_distance_matrix(user_lat, user_lng, sector["Suppliers"])
        sector["Suppliers"].sort(key=lambda x: x.get("distance_km", float("inf")))

    return supplier_data


def get_location_osm(latitude: float, longitude: float) -> Dict[str, Union[str, List[str]]]:
    """
    OpenStreetMap Nominatim API'si ile latitude ve longitude değerinden şehir ve bölge bilgisini döndürür.
    """
    url = f"https://nominatim.openstreetmap.org/reverse?lat={latitude}&lon={longitude}&format=json&accept-language=tr"
    headers = {"User-Agent": "AraBul-Location-Service"}

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        address = data.get("address", {})

        city = address.get("city", address.get("town", address.get("village", "Unknown")))
        possible_region_keys = ["city_district", "neighbourhood", "suburb", "village"]
        region = list(filter(None, {address.get(key) for key in possible_region_keys}))

        return {"city": city, "region": region}
    except requests.exceptions.RequestException as e:
        print(f"OSM API Error: {e}")
        return {"city": "Unknown", "region": []}


# Kullanım örneği
if __name__ == "__main__":
    user_lat, user_lng = 41.015137, 28.979530  # Örnek kullanıcı konumu (İstanbul)
    nace_codes = ["F43.2.1"]
    cities = [{"City": "Lefkoşa"}]
    suppliers_data = fetch_suppliers(nace_codes, cities)
    updated_data = process_suppliers(user_lat, user_lng, suppliers_data)
    print(updated_data)
