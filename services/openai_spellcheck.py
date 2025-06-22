import openai

openai.api_key = "Removed keys"


def gpt_spell_check(text: str, lang: str = "en") -> str:
    if lang == "tr":
        prompt = (
            "Siz bir dilbilgisi düzeltme yardımcısısınız. Cümledeki herhangi bir yazım veya dilbilgisi sorununu düzeltin. "
            "Anlamı değiştirmeyin. Düzeltilmiş cümle dışında hiçbir şey döndürmeyin.\n\n"
            "Örnek:\n"
            "Girdi: lmalp'im bozuldu\n"
            "Çıktı: lambam bozuldu\n\n"
            "Aşağıdaki cümlede yazım ve imla hataları varsa düzelt. "
            "Eğer cümle zaten doğruysa, olduğu gibi döndür.\n\n"
            f"Girdi: {text}\nÇıktı:"
        )
    else:
        prompt = (
            "You are a grammar correction assistant. Fix any spelling or grammar issues in the sentence. "
            "Do not change meaning. Do not return anything except the corrected sentence.\n\n"
            "Example:\n"
            "Input: my lmalp is brokken\n"
            "Output: my lamp is broken\n\n"
            f"Input: {text}\nOutput:"
        )

    try:
        client = openai.OpenAI(api_key="Removed key")
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=60
        )

        return response.choices[0].message.content.strip()
    except Exception as e:
        print("❌ OpenAI Spell Check Error:", e)
        return text
