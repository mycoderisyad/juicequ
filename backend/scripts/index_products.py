"""
Script to index products into ChromaDB for semantic search.
Run this after adding or updating products in the database.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.services.ai.rag_service import RAGService


async def main():
    """Index all products to ChromaDB."""
    print("="*50)
    print("Product Indexing to ChromaDB")
    print("="*50)
    
    db = SessionLocal()
    try:
        rag_service = RAGService(db)
        
        if not rag_service.collection:
            print("ChromaDB not initialized. Check configuration.")
            return
        
        print(f"Current documents in collection: {rag_service.collection.count()}")
        
        count = await rag_service.index_products()
        
        print(f"\nSuccessfully indexed {count} products")
        print(f"Total documents in collection: {rag_service.collection.count()}")
        
        print("\n" + "="*50)
        print("Testing semantic search...")
        print("="*50)
        
        test_queries = [
            "jus segar untuk diet",
            "minuman manis dengan berry",
            "smoothie sehat",
        ]
        
        for query in test_queries:
            print(f"\nQuery: '{query}'")
            results = await rag_service.retrieve_context(query, limit=2)
            for i, result in enumerate(results, 1):
                print(f"  {i}. {result['metadata'].get('name', 'Unknown')}")
                print(f"     {result['text'][:100]}...")
        
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
