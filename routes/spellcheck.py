from fastapi import APIRouter, Query
from services.openai_spellcheck import gpt_spell_check

router = APIRouter()

@router.get("/spellcheck")
def spell_check(text: str = Query(...), lang: str = "en"):
    fixed = gpt_spell_check(text, lang)
    suggestedFix = fixed if fixed.strip().lower() != text.strip().lower() else None

    return {
        "original": text,
        "corrected": fixed,
        "suggestedFix": suggestedFix
    }
