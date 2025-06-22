from deep_translator import GoogleTranslator, MyMemoryTranslator


def translate_to_english(query: str) -> str:
    try:
        mymemory_en = MyMemoryTranslator(source="tr-TR", target="en-US")
        result = mymemory_en.translate(query)
        return result
    except Exception as mymemory_err:
        print("MyMemory→EN failed:", mymemory_err)

    try:
        google_en = GoogleTranslator(source="auto", target="en")
        result = google_en.translate(query)
        return result
    except Exception as google_err:
        print("Google→EN failed:", google_err)

    return query


def translate_to_turkish(query):
    try:
        google_tr = GoogleTranslator(source="auto", target="tr")
        return google_tr.translate(query)
    except Exception as google_err:
        print(google_err)
        try:
            mymemory_tr = MyMemoryTranslator(source="en-US", target="tr-TR")
            return mymemory_tr.translate(query)
        except Exception as mymemory_err:
            print(mymemory_err)
            return query
