"""
Locale configuration for multi-language support.
Easy to add new languages by adding new locale files.
"""
from dataclasses import dataclass
from typing import Optional


@dataclass
class LocaleConfig:
    """Configuration for a single locale."""
    code: str  # Frontend locale code (id, en, jv, su)
    name: str  # Display name
    stt_code: str  # Google Cloud STT language code
    alternative_stt_codes: list[str]  # Alternative STT codes for fallback
    flag: str  # Emoji flag
    is_regional: bool  # Is this a regional language (uses LLM translation)


# Supported locales configuration
# To add a new locale:
# 1. Add entry here
# 2. Create locale file in frontend/src/locales/{code}.json
# 3. Update frontend/src/locales/index.ts
SUPPORTED_LOCALES: dict[str, LocaleConfig] = {
    "id": LocaleConfig(
        code="id",
        name="Bahasa Indonesia",
        stt_code="id-ID",
        alternative_stt_codes=["id"],
        flag="ID",
        is_regional=False,
    ),
    "en": LocaleConfig(
        code="en",
        name="English",
        stt_code="en-US",
        alternative_stt_codes=["en-GB", "en-AU", "en"],
        flag="US",
        is_regional=False,
    ),
    "jv": LocaleConfig(
        code="jv",
        name="Basa Jawa",
        stt_code="jv-ID",  # Javanese (Indonesia)
        alternative_stt_codes=["id-ID"],  # Fallback to Indonesian
        flag="ID",
        is_regional=True,
    ),
    "su": LocaleConfig(
        code="su",
        name="Basa Sunda",
        stt_code="su-ID",  # Sundanese (Indonesia)
        alternative_stt_codes=["id-ID"],  # Fallback to Indonesian
        flag="ID",
        is_regional=True,
    ),
}

DEFAULT_LOCALE = "id"


def get_locale_config(locale: str) -> LocaleConfig:
    """Get locale configuration by code."""
    return SUPPORTED_LOCALES.get(locale, SUPPORTED_LOCALES[DEFAULT_LOCALE])


def get_stt_language_code(locale: str) -> str:
    """Get STT language code for a locale."""
    config = get_locale_config(locale)
    return config.stt_code


def get_alternative_stt_codes(locale: str) -> list[str]:
    """Get alternative STT codes for fallback."""
    config = get_locale_config(locale)
    return config.alternative_stt_codes


def is_regional_language(locale: str) -> bool:
    """Check if locale is a regional language that needs LLM translation."""
    config = get_locale_config(locale)
    return config.is_regional


# System prompts for different locales
# These are used by the LLM to understand context
SYSTEM_PROMPTS: dict[str, str] = {
    "id": """Kamu adalah asisten AI untuk toko jus JuiceQu. 
Tugasmu adalah membantu pelanggan memesan jus, memberikan rekomendasi, dan menjawab pertanyaan tentang produk.
Selalu jawab dalam Bahasa Indonesia yang ramah dan natural.
Fokus hanya pada layanan toko jus - tolak pertanyaan di luar konteks dengan sopan.""",

    "en": """You are an AI assistant for JuiceQu juice store.
Your job is to help customers order juice, provide recommendations, and answer questions about products.
Always respond in friendly and natural English.
Focus only on juice store services - politely decline questions outside this context.""",

    "jv": """Sampeyan iku asisten AI kanggo toko jus JuiceQu.
Tugasmu yaiku mbantu pelanggan pesen jus, menehi rekomendasi, lan mangsuli pitakon babagan produk.
Wangsulana nganggo Basa Jawa sing ramah lan natural.
Fokus mung ing layanan toko jus - tolak pitakon sing ora ana hubungane kanthi sopan.

PENTING: Pelanggan mungkin berbicara dalam Bahasa Jawa. Pahami maksudnya dan proses pesanan dengan benar.
Contoh ungkapan Jawa:
- "Aku pengen jus" = Saya mau jus
- "Pira regane?" = Berapa harganya?
- "Sing enak opo?" = Yang enak apa?
- "Tuku loro" = Beli dua
- "Mlebu keranjang" = Masukkan ke keranjang""",

    "su": """Anjeun teh asisten AI pikeun toko jus JuiceQu.
Tugas anjeun nyaeta ngabantu palanggan mesan jus, mere rekomendasi, jeung ngajawab patarosan ngeunaan produk.
Salawasna jawab make Basa Sunda anu ramah jeung natural.
Fokus ngan kana layanan toko jus - tolak patarosan di luar konteks kalawan sopan.

PENTING: Pelanggan mungkin berbicara dalam Bahasa Sunda. Pahami maksudnya dan proses pesanan dengan benar.
Contoh ungkapan Sunda:
- "Abdi hoyong jus" = Saya mau jus
- "Sabaraha hargana?" = Berapa harganya?
- "Nu ngeunah naon?" = Yang enak apa?
- "Meser dua" = Beli dua
- "Lebetkeun kana karanjang" = Masukkan ke keranjang""",
}


def get_system_prompt(locale: str) -> str:
    """Get system prompt for a locale."""
    return SYSTEM_PROMPTS.get(locale, SYSTEM_PROMPTS[DEFAULT_LOCALE])


# Fallback messages when STT/AI is not available
FALLBACK_MESSAGES: dict[str, dict[str, str]] = {
    "id": {
        "stt_unavailable": "Fitur voice ordering membutuhkan konfigurasi Google Cloud Speech-to-Text. Silakan ketik pesanan Anda.",
        "ai_unavailable": "Maaf, layanan AI sedang tidak tersedia. Silakan coba lagi nanti.",
        "no_speech": "Tidak ada suara terdeteksi. Silakan coba lagi.",
        "mic_error": "Mikrofon tidak tersedia. Periksa izin mikrofon.",
        "network_error": "Koneksi jaringan bermasalah.",
    },
    "en": {
        "stt_unavailable": "Voice ordering requires Google Cloud Speech-to-Text configuration. Please type your order instead.",
        "ai_unavailable": "Sorry, AI service is currently unavailable. Please try again later.",
        "no_speech": "No speech detected. Please try again.",
        "mic_error": "Microphone not available. Check microphone permissions.",
        "network_error": "Network connection error.",
    },
    "jv": {
        "stt_unavailable": "Fitur voice ordering butuh konfigurasi Google Cloud Speech-to-Text. Tulung ketik pesenanmu.",
        "ai_unavailable": "Nyuwun pangapunten, layanan AI lagi ora kasedhiya. Tulung coba maneh mengko.",
        "no_speech": "Ora ana swara sing kedeteksi. Tulung coba maneh.",
        "mic_error": "Mikrofon ora kasedhiya. Priksa ijin mikrofon.",
        "network_error": "Koneksi jaringan ana masalah.",
    },
    "su": {
        "stt_unavailable": "Fitur voice ordering butuh konfigurasi Google Cloud Speech-to-Text. Mangga ketik pesenan anjeun.",
        "ai_unavailable": "Hapunten, layanan AI ayeuna teu sadia. Mangga cobian deui engke.",
        "no_speech": "Teu aya sora nu kadeteksi. Mangga cobian deui.",
        "mic_error": "Mikropon teu sadia. Pariksa idin mikropon.",
        "network_error": "Koneksi jaringan aya masalah.",
    },
}


def get_fallback_message(locale: str, message_key: str) -> str:
    """Get fallback message for a locale."""
    locale_messages = FALLBACK_MESSAGES.get(locale, FALLBACK_MESSAGES[DEFAULT_LOCALE])
    return locale_messages.get(message_key, locale_messages.get("ai_unavailable", "Service unavailable"))


# LLM prompt for understanding regional languages
REGIONAL_LANGUAGE_PROMPT = """
You are processing a voice command that may be in a regional Indonesian language.
The user's locale is: {locale} ({locale_name})

IMPORTANT: The speech-to-text may have transcribed the regional language imperfectly.
Your task is to:
1. Understand the user's intent regardless of the language used
2. Extract order information (product names, quantities, actions)
3. Respond appropriately in the user's preferred language

Common patterns to recognize:
- Order intent: "tuku", "pesen", "meser", "beli", "order", "mau", "pengen", "hoyong"
- Add to cart: "mlebu keranjang", "lebetkeun", "tambah", "masukin"
- Quantity words: "siji/hiji" (1), "loro/dua" (2), "telu/tilu" (3), etc.
- Question words: "pira/sabaraha" (how much), "opo/naon" (what)

User's message: {message}

Process this and respond in {locale_name}.
"""


def get_regional_language_prompt(locale: str, message: str) -> str:
    """Get prompt for processing regional language input."""
    config = get_locale_config(locale)
    return REGIONAL_LANGUAGE_PROMPT.format(
        locale=locale,
        locale_name=config.name,
        message=message,
    )

