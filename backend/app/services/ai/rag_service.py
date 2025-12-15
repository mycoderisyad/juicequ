"""RAG Service for Retrieval-Augmented Generation."""
import logging
from typing import Any, Optional

from sqlalchemy.orm import Session

from app.config import settings
from app.models.product import Product

logger = logging.getLogger(__name__)

try:
    import chromadb

    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    logger.warning("ChromaDB not available - RAG will use SQL fallback only")


class RAGService:
    """Service for RAG (Retrieval-Augmented Generation) operations."""

    def __init__(self, db: Session):
        """Initialize RAG service with ChromaDB."""
        self.db = db
        self.chroma_client = None
        self.collection = None

        if not CHROMADB_AVAILABLE:
            logger.warning("ChromaDB not installed - RAG features disabled")
            return

        try:
            self.chroma_client = chromadb.PersistentClient(path=settings.chroma_persist_directory)
            self.collection = self.chroma_client.get_or_create_collection(
                name="products", metadata={"description": "Product embeddings for semantic search"}
            )
            logger.info("ChromaDB initialized with %d documents", self.collection.count())
        except Exception as e:
            logger.error("Failed to initialize ChromaDB: %s", e)
            self.chroma_client = None
            self.collection = None

    async def retrieve_context(
        self,
        query: str,
        limit: int = 5,
    ) -> list[dict[str, Any]]:
        """
        Retrieve relevant context for a query.

        Args:
            query: User query to find context for
            limit: Maximum number of context chunks

        Returns:
            List of context chunks with text and metadata
        """
        if self.collection and self.collection.count() > 0:
            try:
                results = self.collection.query(
                    query_texts=[query],
                    n_results=limit,
                )

                if results and results.get("documents") and results["documents"][0]:
                    contexts = []
                    for i, doc in enumerate(results["documents"][0]):
                        metadata = results["metadatas"][0][i] if results.get("metadatas") else {}
                        contexts.append({"text": doc, "metadata": metadata})
                    return contexts
            except Exception as e:
                logger.warning("ChromaDB query failed, falling back to SQL: %s", e)

        products = (
            self.db.query(Product)
            .filter(Product.is_available == True)
            .order_by(Product.order_count.desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "text": self._format_product_context(p),
                "metadata": {
                    "product_id": str(p.id),
                    "name": p.name,
                    "type": "product",
                },
            }
            for p in products
        ]

    def _format_product_context(self, product: Product) -> str:
        """Format product information for context."""
        parts = [f"{product.name}"]

        if product.description:
            parts.append(product.description)

        parts.append(f"Harga: Rp {product.base_price:,.0f}")

        if product.ingredients:
            parts.append(f"Bahan: {product.ingredients}")

        if product.calories:
            parts.append(f"Kalori: {product.calories} kcal")

        return ". ".join(parts)

    async def index_products(self) -> int:
        """
        Index all products to vector database.

        Returns:
            Number of products indexed
        """
        if not self.collection:
            logger.warning("ChromaDB not initialized, skipping indexing")
            return 0

        products = self.db.query(Product).filter(Product.is_available == True).all()

        if not products:
            logger.info("No products to index")
            return 0

        existing_count = self.collection.count()
        if existing_count > 0:
            all_ids = self.collection.get()["ids"]
            if all_ids:
                self.collection.delete(ids=all_ids)

        documents = []
        metadatas = []
        ids = []

        for product in products:
            doc_text = self._format_product_context(product)
            documents.append(doc_text)
            metadatas.append({
                "product_id": str(product.id),
                "name": product.name,
                "category": product.category.name if product.category else "N/A",
                "price": str(product.base_price),
                "type": "product",
            })
            ids.append(f"product_{product.id}")

        self.collection.add(documents=documents, metadatas=metadatas, ids=ids)

        logger.info("Indexed %d products to vector database", len(products))
        return len(products)

    async def close(self) -> None:
        """Clean up resources."""
        pass
