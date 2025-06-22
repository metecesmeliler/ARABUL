from routes.location import router
from models.chat_model import ChatBusinessRequest, ChatNaceCodeRequest
from services.chromadb_service import semantic_search
from services.external_api_service import fetch_suppliers
from services.distance_duration_service import process_suppliers
from services.translation_service import translate_to_english, translate_to_turkish


@router.post("/get_businesses")
async def chat_business_endpoint(request: ChatBusinessRequest):
    print(f"Incoming Data: {request.model_dump()}")  # Display the incoming data

    nace_code = [request.naceCode]

    # Format cities
    formatted_cities = [{"City": city.city, "Regions": []} for city in request.cities]

    # Fetch suppliers
    suppliers = fetch_suppliers(nace_code, formatted_cities)

    # Calculate distance and duration
    updated_suppliers = process_suppliers(request.latitude, request.longitude, suppliers)

    print(f"Outgoing Data: {updated_suppliers}") # Display the outgoing data

    return {"success": True, "data": updated_suppliers}


@router.post("/get_nace_codes")
async def chat_nace_code_endpoint(request: ChatNaceCodeRequest):
    print(f"Incoming Data: {request.model_dump()}") # Display the incoming data

    # Translate the user query
    translated_query = translate_to_english(request.query)
    results, status = semantic_search(translated_query)

    if status == "no_hits":
        return {"success": False, "data": "Semantic search failed"}

    if status == "threshold":
        return {"success": False, "data": "No results met the confidence threshold"}

    # Form NACE codes with their descriptions, translate the descriptions to Turkish if the language is "tr"
    nace_codes = []
    for result in results:
        desc_en = result["metadata"]["category"].strip('"')

        if request.language.lower() == "tr":
            desc_tr = translate_to_turkish(desc_en)
            description = desc_tr
        else:
            description = desc_en

        nace_codes.append(
            {
                "code": result["id"],
                "description": description,
            }
        )

    print(f"Outgoing Data: {nace_codes}") # Display the outgoing data

    return {"success": True, "data": {"naceCodes": nace_codes}}
