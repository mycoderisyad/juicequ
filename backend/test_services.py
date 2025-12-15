"""Test script to verify services are working properly."""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings


async def test_gemini_api():
    """Test Gemini AI API connection."""
    print("\n" + "=" * 50)
    print("Testing Gemini AI API")
    print("=" * 50)

    if not settings.gemini_api_key:
        print("[FAIL] GEMINI_API_KEY is not set")
        return False

    print(f"[OK] API Key: {settings.gemini_api_key[:20]}...")

    try:
        from app.services.ai.llm_provider import get_llm_provider

        provider = get_llm_provider()

        if not provider.primary_available:
            print("[FAIL] Gemini client not initialized")
            return False

        print("[OK] Gemini client initialized")

        result = await provider.chat_completion(
            messages=[{"role": "user", "content": "Say hello in Indonesian"}],
            max_tokens=50,
        )

        if result.get("content"):
            print("[OK] Gemini AI API is working!")
            print(f"AI Response: {result['content'][:200]}")
            print(f"Provider: {result.get('provider', 'unknown')}")
            return True
        else:
            print(f"[FAIL] Empty response: {result.get('error', 'unknown error')}")
            return False

    except Exception as e:
        print(f"[FAIL] Unexpected Error: {e}")
        return False


async def test_openrouter_api():
    """Test OpenRouter API connection."""
    print("\n" + "=" * 50)
    print("Testing OpenRouter API")
    print("=" * 50)

    if not settings.openrouter_api_key:
        print("[SKIP] OPENROUTER_API_KEY is not set")
        return True

    print(f"[OK] API Key: {settings.openrouter_api_key[:20]}...")
    print(f"[OK] Model: {settings.openrouter_model}")

    try:
        from app.services.ai.openrouter_client import OpenRouterClient

        client = OpenRouterClient()

        result = await client.chat_completion(
            messages=[{"role": "user", "content": "Say hello"}],
            max_tokens=50,
        )

        if result.get("content"):
            print("[OK] OpenRouter API is working!")
            print(f"AI Response: {result['content'][:200]}")
            return True
        else:
            print(f"[FAIL] Error: {result.get('error', 'unknown')}")
            return False

    except Exception as e:
        print(f"[FAIL] Unexpected Error: {e}")
        return False


def test_database():
    """Test database connection."""
    print("\n" + "=" * 50)
    print("Testing Database Connection")
    print("=" * 50)

    print(f"Database URL: {settings.database_url[:50]}...")

    try:
        from app.db.database import engine
        from sqlalchemy import text

        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print("[OK] Database connection successful!")

            from app.models.product import Product
            from app.db.session import SessionLocal

            db = SessionLocal()
            try:
                product_count = db.query(Product).count()
                available_count = db.query(Product).filter(Product.is_available == True).count()
                print(f"[OK] Total products: {product_count}")
                print(f"[OK] Available products: {available_count}")
            finally:
                db.close()

            return True
    except Exception as e:
        print(f"[FAIL] Database Error: {e}")
        return False


def test_redis():
    """Test Redis connection."""
    print("\n" + "=" * 50)
    print("Testing Redis Connection")
    print("=" * 50)

    print(f"Redis URL: {settings.redis_url}")

    try:
        from app.services.conversation_memory import get_conversation_memory

        memory = get_conversation_memory()

        if memory.is_available:
            print("[OK] Redis connection successful!")
            return True
        else:
            print("[WARN] Redis not available - conversation memory disabled")
            return True

    except Exception as e:
        print(f"[FAIL] Redis Error: {e}")
        return False


def test_chromadb():
    """Test ChromaDB setup."""
    print("\n" + "=" * 50)
    print("Testing ChromaDB")
    print("=" * 50)

    print(f"ChromaDB Directory: {settings.chroma_persist_directory}")

    try:
        import chromadb

        client = chromadb.PersistentClient(path=settings.chroma_persist_directory)

        collection = client.get_or_create_collection(
            name="products", metadata={"description": "Product embeddings for semantic search"}
        )

        print("[OK] ChromaDB initialized successfully!")
        print(f"[OK] Collection 'products' count: {collection.count()}")

        return True
    except ImportError:
        print("[WARN] ChromaDB not installed. Install with: pip install chromadb")
        return False
    except Exception as e:
        print(f"[FAIL] ChromaDB Error: {e}")
        return False


async def test_ai_service():
    """Test AI Service integration."""
    print("\n" + "=" * 50)
    print("Testing AI Service")
    print("=" * 50)

    try:
        from app.db.session import SessionLocal
        from app.services.ai_service import AIService

        db = SessionLocal()
        try:
            ai_service = AIService(db)

            print("Testing chat function...")
            result = await ai_service.chat(user_input="Halo, rekomendasikan jus yang segar dong", locale="id")

            print("[OK] AI Service chat successful!")
            print(f"Response: {result.get('response', '')[:200]}...")
            print(f"Intent: {result.get('intent')}")
            print(f"Response time: {result.get('response_time_ms')}ms")

            await ai_service.close()
            return True

        finally:
            db.close()

    except Exception as e:
        print(f"[FAIL] AI Service Error: {e}")
        import traceback

        traceback.print_exc()
        return False


async def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("JuiceQu Service Health Check")
    print("=" * 60)

    results = {}

    results["database"] = test_database()
    results["redis"] = test_redis()
    results["gemini_api"] = await test_gemini_api()
    results["openrouter_api"] = await test_openrouter_api()
    results["chromadb"] = test_chromadb()
    results["ai_service"] = await test_ai_service()

    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)

    for service, status in results.items():
        status_str = "[PASS]" if status else "[FAIL]"
        print(f"{status_str} {service}")

    total_pass = sum(1 for s in results.values() if s)
    total_tests = len(results)
    print(f"\nTotal: {total_pass}/{total_tests} tests passed")

    return all(results.values())


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
