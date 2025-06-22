from fastapi import APIRouter
from utils.location_utils import get_location_osm

router = APIRouter()

@router.get("/")
async def get_location(lat: float, lon: float):
    location = get_location_osm(lat, lon)
    return location if location else {"error": "Location not found"}
