from fastapi import APIRouter, Request, HTTPException, Depends, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, Union, List
import requests
import json
from services.external_api_service import fetch_supplier_detail_by_id
from user_operations import (
    UserData, 
    FavoriteData, 
    ComplaintData,
    get_all_users,
    register_user, 
    login_user, 
    toggle_favorite, 
    get_user_favorites, 
    check_is_favorite, 
    get_popular_suppliers,
    submit_complaint,
    get_user_complaints,
    get_supplier_details,
    google_register_or_login,
    submit_rating, 
    get_user_rating,
    update_profile,
    calculate_bulk_average_ratings,
    RatingData
)

# Import GOOGLE_CLIENT_IDS directly
try:
    from web_client_ids import GOOGLE_CLIENT_IDS
except ImportError:
    print("Warning: web_client_ids.py not found in routes. Using default IDs.")
    GOOGLE_CLIENT_IDS = {
        "web": "<ID_HERE>",
        "android": "<ID_HERE>",
        "ios": "<ID_HERE>"
    }

class GoogleAuthRequest(BaseModel):
    token: str
    platform: Optional[str] = "android"

class GoogleCodeExchange(BaseModel):
    code: str

class UpdateProfileRequest(BaseModel):
    old_email: EmailStr
    old_password: str
    new_email: Optional[EmailStr] = None
    new_password: Optional[str] = None

router = APIRouter(tags=["User"])

@router.post("/register")
async def register(data: UserData):
    return register_user(data)

@router.post("/login")
async def login(data: UserData):
    return login_user(data)

@router.post("/add-favourite")
async def add_favourite(data: FavoriteData):
    return toggle_favorite(
        data.user_id,
        data.supplier_id,
        data.favorited_at,
        data.screen_opened_at,
        data.is_valid_favorite
    )

@router.get("/favorites/{user_id}")
async def get_favorites(user_id: int):
    return {"favorites": get_user_favorites(user_id)}

@router.get("/is-favorite")
async def is_favorite(user_id: int, supplier_id: str):
    return check_is_favorite(user_id, supplier_id)

@router.get("/popular-suppliers")
async def popular_suppliers():
    return get_popular_suppliers()

@router.post("/sort-suppliers")
async def sort_suppliers(request: Request):
    data = await request.json()
    suppliers = data.get("suppliers", [])
    popular_data = get_popular_suppliers()
    popularity_map = {entry["supplier_id"]: entry["count"] for entry in popular_data}
    for s in suppliers:
        s["popularity"] = popularity_map.get(s.get("SupplierID"), 0)
    return sorted(suppliers, key=lambda s: s["popularity"], reverse=True)

@router.post("/submit-complaint")
async def add_complaint(data: ComplaintData):
    return submit_complaint(
        data.user_id,
        data.complaint_text,
        data.supplier_id
    )

@router.get("/complaints/{user_id}")
async def get_complaints(user_id: int):
    return {"complaints": get_user_complaints(user_id)}

@router.get("/supplier/{supplier_id}")
async def supplier_details(supplier_id: str):
    return get_supplier_details(supplier_id)

@router.get("/generate-test-token")
async def generate_test_token():
    """Generate a test token for Google auth testing"""
    try:
        import jwt
        import time
        
        # Log to confirm function is reached
        print("Generating test token...")
        
        # Debug GOOGLE_CLIENT_IDS
        print(f"GOOGLE_CLIENT_IDS available: {GOOGLE_CLIENT_IDS is not None}")
        print(f"Web client ID: {GOOGLE_CLIENT_IDS.get('web')}")
        
        # JWT token için gerekli alanlar
        payload = {
            "iss": "https://accounts.google.com",
            "azp": GOOGLE_CLIENT_IDS.get("web"),
            "aud": GOOGLE_CLIENT_IDS.get("web"),
            "sub": "1234567890",  # Fake user ID
            "email": "test@google.com",
            "email_verified": True,
            "name": "Test User",
            "picture": "https://example.com/photo.jpg",
            "given_name": "Test",
            "family_name": "User",
            "locale": "en",
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600  # 1 saat geçerli
        }
        
        print("Payload created, encoding JWT...")
        
        # JWT token oluştur (geçici test amaçlı)
        # Gerçek bir JWT sign etmek için gerçek bir secret key kullanmak gerekir
        # Bu sadece test amaçlıdır ve gerçek bir Google token değildir
        test_token = jwt.encode(payload, "test_secret_key", algorithm="HS256")
        
        print(f"JWT token created: {test_token[:20]}...")
        
        return {"test_token": test_token}
    except Exception as e:
        print(f"Error generating test token: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate test token: {str(e)}")

@router.post("/google-auth")
async def google_authenticate(request: GoogleAuthRequest):
    """Handle Google authentication (both registration and login)"""
    try:
        result = google_register_or_login(request.token, request.platform)
        return JSONResponse(content=result)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/google/token")
async def exchange_code_for_token(data: GoogleCodeExchange):
    """Exchange authorization code for Google tokens"""
    try:
        # Google OAuth2 token exchange endpoint
        token_url = "https://oauth2.googleapis.com/token"
        
        # Client ID'yi platforma göre seç (varsayılan olarak web)
        client_id = GOOGLE_CLIENT_IDS.get("web")
        client_secret = "YOUR_CLIENT_SECRET"  # Google Cloud Console'dan client secret alın
        
        # Token exchange payload
        payload = {
            "code": data.code,
            "client_id": client_id,
            "client_secret": client_secret,
            # "redirect_uri": f"{CONFIG_BASE_URL}/auth/google/callback",  # Backend base URL + callback path
            "grant_type": "authorization_code"
        }
        
        # Google'a istek gönder
        response = requests.post(token_url, data=payload)
        
        if response.status_code != 200:
            print(f"Google token exchange error: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=400, 
                detail=f"Google token exchange failed: {response.text}"
            )
        
        # Token yanıtını parse et
        token_data = response.json()
        
        # Gerekli token'ları al
        id_token = token_data.get("id_token")
        access_token = token_data.get("access_token")
        
        if not id_token:
            raise HTTPException(status_code=400, detail="No ID token in Google response")
        
        return {
            "id_token": id_token,
            "access_token": access_token
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Code exchange error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Token exchange error: {str(e)}")

@router.get("/favorites-detailed/{user_id}")
async def favorites_detailed(user_id: int):
    print(f"[DEBUG] favorites_detailed called for user_id: {user_id}")
    supplier_ids = get_user_favorites(user_id)
    print(f"[DEBUG] Found supplier_ids: {supplier_ids}")
    
    detailed_suppliers = []

    for supplier_id in supplier_ids:
        print(f"[DEBUG] Fetching details for supplier_id: {supplier_id}")
        supplier = fetch_supplier_detail_by_id(supplier_id)
        
        if supplier:
            print(f"[DEBUG] Successfully fetched supplier: {supplier.get('CompanyName', 'Unknown')}")
            supplier["distance_km"] = 0
            supplier["duration"] = "0 dakika"
            detailed_suppliers.append(supplier)
        else:
            print(f"[DEBUG] Failed to fetch supplier details for: {supplier_id}")
            # Create a minimal supplier object with the saved ID
            fallback_supplier = {
                "SupplierID": supplier_id,
                "CompanyName": f"İş Yeri #{supplier_id}",
                "Category": "Bilinmeyen",
                "Address": "Adres bilgisi alınamadı",
                "PhoneNumber": "",
                "distance_km": 0,
                "duration": "0 dakika",
                "WorkingHours": "Bilgi alınamadı",
                "Website": "",
                "Email": ""
            }
            detailed_suppliers.append(fallback_supplier)
            print(f"[DEBUG] Added fallback supplier for: {supplier_id}")

    print(f"[DEBUG] Returning {len(detailed_suppliers)} detailed suppliers")
    return {"success": True, "data": detailed_suppliers}

@router.post("/update-profile")
async def update_user_profile(data: UpdateProfileRequest):
    """Update user's profile (email and/or password)"""
    try:
        print(f"Received profile update request: {data.dict(exclude={'old_password', 'new_password'})}")
        
        result = update_profile(
            data.old_email,
            data.old_password,
            data.new_email,
            data.new_password
        )
        
        print(f"Profile update result: {result}")
        return result
    except HTTPException as e:
        print(f"Profile update HTTPException: {e.detail}")
        raise e
    except Exception as e:
        print(f"Profile update general exception: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/rating")
async def add_rating(data: RatingData):
    return submit_rating(data)

@router.get("/rating/user")
async def fetch_user_rating(user_id: int, supplier_id: str):
    try:
        return get_user_rating(user_id, supplier_id)
    except HTTPException as e:
        if e.status_code == 404:
            return JSONResponse(status_code=404, content={"detail": "No rating found"})
        raise
    except Exception as e:
        print(f"[UNEXPECTED ERROR] fetch_user_rating failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/rating/rankings")
async def get_bulk_ratings(supplier_ids: List[str] = Body(...)):
    return calculate_bulk_average_ratings(supplier_ids)

