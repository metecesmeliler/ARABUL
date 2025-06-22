import json
from functools import lru_cache
import requests
from typing import List
from config import SUPPLIER_LIST_ENDPOINT, SUPPLIER_DETAIL_ENDPOINT


def flatten_key(nace_codes: List[str], cities: List[dict]) -> str:
    nace_str = "_".join(sorted(nace_codes))
    city_str = "_".join(sorted([city["City"] for city in cities]))
    return f"{nace_str}__{city_str}"


@lru_cache(maxsize=1024)
def fetch_suppliers_cached(flat_key: str):
    # optional mock loader
    # with open("suppliers_mock.json") as f:
    #     return json.load(f)

    payload = {
        "NaceCodes": [{"NaceCode": code} for code in flat_key.split("__")[0].split("_")],
        "Cities": [{"City": city, "Regions": []} for city in flat_key.split("__")[1].split("_")],
        "NoofResults": 3,
        "Page": 1
    }

    try:
        response = requests.post(SUPPLIER_LIST_ENDPOINT, json=payload, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"[fetch_suppliers_cached] External API error: {e}")
        return {"data": []}


def fetch_suppliers(nace_codes: List[str], cities: List[dict]):
    flat_key = flatten_key(nace_codes, cities)
    return fetch_suppliers_cached(flat_key)


import requests
import json

import json
import re

def fetch_supplier_detail_by_id(supplier_id: str):
    try:
        payload = {"SupplierID": str(supplier_id)}
        headers = {"Content-Type": "application/json"}
        print(f"[DEBUG] Requesting supplier details for ID: {supplier_id}")
        print(f"[DEBUG] Using endpoint: {SUPPLIER_DETAIL_ENDPOINT}")
        print(f"[DEBUG] Payload: {payload}")
        
        response = requests.post(SUPPLIER_DETAIL_ENDPOINT, json=payload, headers=headers, timeout=10)
        
        print(f"[DEBUG] Response status code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"[DEBUG] API returned error status: {response.status_code}")
            print(f"[DEBUG] Response text: {response.text}")
            return None
            
        raw_text = response.text
        print(f"[DEBUG] Raw response length: {len(raw_text)}")
        print(f"[DEBUG] Raw response preview: {raw_text[:200]}...")
        
        # Clean the response
        cleaned = re.sub(r'[\x00-\x1f\x7f]', '', raw_text)
        
        # Try to parse JSON
        data = json.loads(cleaned)
        print(f"[DEBUG] Successfully parsed JSON. Company: {data.get('CompanyName', 'Unknown')}")
        return data

    except json.decoder.JSONDecodeError as e:
        print(f"[fetch_supplier_detail_by_id] JSON decode error: {e}")
        print(f"[fetch_supplier_detail_by_id] Raw text that caused error: {raw_text[:500]}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"[fetch_supplier_detail_by_id] Request error: {e}")
        return None
    except Exception as e:
        print(f"[fetch_supplier_detail_by_id] Unexpected error: {e}")
        return None




