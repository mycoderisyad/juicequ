"""
Test script to verify services are working properly.
"""
import asyncio
import httpx
import os
import sys

# Add the backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings


async def test_kolosal_api():
    """Test Kolosal AI API connection."""
    print("\n" + "="*50)
    print("Testing Kolosal AI API")
    print("="*50)
    
    if not settings.kolosal_api_key:
        print("❌ KOLOSAL_API_KEY is not set")
        return False
    
    print(f"✅ API Key: {settings.kolosal_api_key[:30]}...")
    print(f"✅ API Base: {settings.kolosal_api_base}")
    print(f"✅ Model: {settings.kolosal_model}")
    
    try:
        async with httpx.AsyncClient(
            base_url=settings.kolosal_api_base,
            headers={
                "Authorization": f"Bearer {settings.kolosal_api_key}",
                "Content-Type": "application/json",
            },
            timeout=30.0,
        ) as client:
            response = await client.post(
                "/chat/completions",
                json={
                    "model": settings.kolosal_model,
                    "messages": [{"role": "user", "content": "Say hello in Indonesian"}],
                    "max_tokens": 50,
                },
            )
            
            print(f"\nAPI Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Kolosal AI API is working!")
                
                # Parse response
                if "choices" in data and len(data["choices"]) > 0:
                    content = data["choices"][0].get("message", {}).get("content", "")
                    print(f"AI Response: {content[:200]}")
                else:
                    print(f"Response data: {data}")
                return True
            else:
                print(f"❌ API Error: {response.status_code}")
                print(f"Response: {response.text[:500]}")
                return False
                
    except httpx.RequestError as e:
        print(f"❌ Request Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return False


def test_database():
    """Test database connection."""
    print("\n" + "="*50)
    print("Testing Database Connection")
    print("="*50)
    
    print(f"Database URL: {settings.database_url}")
    
    try:
        from app.db.database import engine
        from sqlalchemy import text
        
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            
            # Count products
            from app.models.product import Product
            from app.db.session import SessionLocal
            
            db = SessionLocal()
            try:
                product_count = db.query(Product).count()
                available_count = db.query(Product).filter(Product.is_available == True).count()
                print(f"✅ Total products: {product_count}")
                print(f"✅ Available products: {available_count}")
            finally:
                db.close()
            
            return True
    except Exception as e:
        print(f"❌ Database Error: {e}")
        return False


def test_chromadb():
    """Test ChromaDB setup."""
    print("\n" + "="*50)
    print("Testing ChromaDB")
    print("="*50)
    
    print(f"ChromaDB Directory: {settings.chroma_persist_directory}")
    
    try:
        import chromadb
        
        # Use the new PersistentClient API
        client = chromadb.PersistentClient(path=settings.chroma_persist_directory)
        
        # Create or get collection
        collection = client.get_or_create_collection(
            name="products",
            metadata={"description": "Product embeddings for semantic search"}
        )
        
        print(f"✅ ChromaDB initialized successfully!")
        print(f"✅ Collection 'products' count: {collection.count()}")
        
        return True
    except ImportError:
        print("⚠️ ChromaDB not installed. Install with: pip install chromadb")
        return False
    except Exception as e:
        print(f"❌ ChromaDB Error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_ai_service():
    """Test AI Service integration."""
    print("\n" + "="*50)
    print("Testing AI Service")
    print("="*50)
    
    try:
        from app.db.session import SessionLocal
        from app.services.ai_service import AIService
        
        db = SessionLocal()
        try:
            ai_service = AIService(db)
            
            # Test chat function
            print("Testing chat function...")
            result = await ai_service.chat(
                user_input="Halo, rekomendasikan jus yang segar dong",
                locale="id"
            )
            
            print(f"✅ AI Service chat successful!")
            print(f"Response: {result.get('response', '')[:200]}...")
            print(f"Intent: {result.get('intent')}")
            print(f"Response time: {result.get('response_time_ms')}ms")
            
            await ai_service.close()
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ AI Service Error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests."""
    print("\n" + "="*60)
    print("JuiceQu Service Health Check")
    print("="*60)
    
    results = {}
    
    # Test 1: Database
    results["database"] = test_database()
    
    # Test 2: Kolosal AI API
    results["kolosal_api"] = await test_kolosal_api()
    
    # Test 3: ChromaDB
    results["chromadb"] = test_chromadb()
    
    # Test 4: AI Service (full integration)
    results["ai_service"] = await test_ai_service()
    
    # Summary
    print("\n" + "="*60)
    print("Test Summary")
    print("="*60)
    
    for service, status in results.items():
        emoji = "✅" if status else "❌"
        print(f"{emoji} {service}: {'PASS' if status else 'FAIL'}")
    
    total_pass = sum(1 for s in results.values() if s)
    total_tests = len(results)
    print(f"\nTotal: {total_pass}/{total_tests} tests passed")
    
    return all(results.values())


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
