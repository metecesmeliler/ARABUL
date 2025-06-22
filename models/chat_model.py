from pydantic import BaseModel
from typing import List, Optional

class CityModel(BaseModel):
    city: str  # ✅ Sadece şehir bilgisi tutuluyor

class ChatNaceCodeRequest(BaseModel):
    query: str
    language: str = "en"

class ChatBusinessRequest(BaseModel):
    naceCode: str
    cities: List[CityModel]
    latitude: Optional[float] = None  # ✅ Latitude bilgisi alınıyor ama kullanılmıyor
    longitude: Optional[float] = None  # ✅ Longitude bilgisi alınıyor ama kullanılmıyor
