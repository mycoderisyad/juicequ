"""
Storage Service for file uploads.
Handles local filesystem storage for VPS deployment.
Images are stored on the same server as the application.
"""
import logging
import os
import shutil
import uuid
from pathlib import Path
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    """
    Service for file storage operations using local filesystem.
    
    This service stores files on the local VPS server, making it cost-effective
    for small businesses that don't need cloud storage services.
    
    Files are stored in a structured directory:
    - /uploads/products/    - Product images
    - /uploads/users/       - User avatars
    - /uploads/temp/        - Temporary files
    """
    
    def __init__(self, base_path: Optional[str] = None):
        """
        Initialize storage service with local filesystem.
        
        Args:
            base_path: Base directory for file storage. 
                      Defaults to settings.upload_base_path or './uploads'
        """
        self.base_path = Path(base_path or settings.upload_base_path or "./uploads")
        self._ensure_directories()
    
    def _ensure_directories(self) -> None:
        """Create necessary storage directories if they don't exist."""
        directories = [
            self.base_path,
            self.base_path / "products",
            self.base_path / "products" / "hero",
            self.base_path / "products" / "catalog",
            self.base_path / "products" / "thumbnails",
            self.base_path / "users",
            self.base_path / "temp",
        ]
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            logger.debug("Ensured directory exists: %s", directory)
    
    def _generate_unique_filename(self, original_filename: str) -> str:
        """Generate a unique filename while preserving extension."""
        ext = ""
        if "." in original_filename:
            ext = "." + original_filename.rsplit(".", 1)[-1].lower()
        return f"{uuid.uuid4()}{ext}"
    
    def _get_full_path(self, folder: str, filename: str) -> Path:
        """Get the full filesystem path for a file."""
        return self.base_path / folder / filename
    
    async def upload_file(
        self,
        file_data: bytes,
        filename: str,
        content_type: str,
        folder: str = "products",
    ) -> str:
        """
        Upload a file to local storage.
        
        Args:
            file_data: Binary file data
            filename: Original filename
            content_type: MIME type (used for validation)
            folder: Storage subfolder (e.g., 'products', 'products/hero', 'users')
        
        Returns:
            Public URL path to the uploaded file (e.g., '/uploads/products/uuid.png')
        """
        # Validate content type for images
        allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
        if content_type not in allowed_types:
            logger.warning("Invalid content type attempted: %s", content_type)
            raise ValueError(f"Invalid file type. Allowed: {', '.join(allowed_types)}")
        
        # Generate unique filename
        unique_filename = self._generate_unique_filename(filename)
        
        # Ensure folder exists
        folder_path = self.base_path / folder
        folder_path.mkdir(parents=True, exist_ok=True)
        
        # Write file to disk
        file_path = folder_path / unique_filename
        try:
            with open(file_path, "wb") as f:
                f.write(file_data)
            logger.info("File uploaded successfully: %s", file_path)
        except IOError as e:
            logger.error("Failed to write file: %s", e)
            raise RuntimeError(f"Failed to save file: {e}")
        
        # Return public URL path
        return f"/uploads/{folder}/{unique_filename}"
    
    async def upload_file_from_path(
        self,
        source_path: str,
        folder: str = "products",
    ) -> str:
        """
        Upload a file from an existing path (move or copy).
        
        Args:
            source_path: Path to source file
            folder: Storage subfolder
        
        Returns:
            Public URL path to the uploaded file
        """
        source = Path(source_path)
        if not source.exists():
            raise FileNotFoundError(f"Source file not found: {source_path}")
        
        unique_filename = self._generate_unique_filename(source.name)
        
        folder_path = self.base_path / folder
        folder_path.mkdir(parents=True, exist_ok=True)
        
        dest_path = folder_path / unique_filename
        shutil.copy2(source, dest_path)
        
        logger.info("File copied: %s -> %s", source, dest_path)
        return f"/uploads/{folder}/{unique_filename}"
    
    async def delete_file(self, url: str) -> bool:
        """
        Delete a file from local storage.
        
        Args:
            url: File URL path (e.g., '/uploads/products/uuid.png')
        
        Returns:
            True if deleted successfully, False if file not found
        """
        # Extract relative path from URL
        if url.startswith("/uploads/"):
            relative_path = url[9:]  # Remove '/uploads/' prefix
        elif url.startswith("uploads/"):
            relative_path = url[8:]  # Remove 'uploads/' prefix
        else:
            relative_path = url
        
        file_path = self.base_path / relative_path
        
        try:
            if file_path.exists():
                file_path.unlink()
                logger.info("File deleted: %s", file_path)
                return True
            else:
                logger.warning("File not found for deletion: %s", file_path)
                return False
        except IOError as e:
            logger.error("Failed to delete file: %s", e)
            return False
    
    def get_file_path(self, url: str) -> Optional[Path]:
        """
        Get the full filesystem path for a file URL.
        
        Args:
            url: File URL path
        
        Returns:
            Full Path object if file exists, None otherwise
        """
        if url.startswith("/uploads/"):
            relative_path = url[9:]
        elif url.startswith("uploads/"):
            relative_path = url[8:]
        else:
            relative_path = url
        
        file_path = self.base_path / relative_path
        return file_path if file_path.exists() else None
    
    def file_exists(self, url: str) -> bool:
        """Check if a file exists at the given URL path."""
        return self.get_file_path(url) is not None
    
    def get_public_url(self, path: str) -> str:
        """
        Convert a relative path to a public URL.
        
        In production with a reverse proxy (nginx), this will serve
        the files directly from the uploads directory.
        
        Args:
            path: Relative path within uploads folder
        
        Returns:
            Public URL path
        """
        if path.startswith("/"):
            path = path[1:]
        return f"/uploads/{path}"
    
    async def cleanup_temp_files(self, max_age_hours: int = 24) -> int:
        """
        Clean up old temporary files.
        
        Args:
            max_age_hours: Delete files older than this
        
        Returns:
            Number of files deleted
        """
        import time
        
        temp_dir = self.base_path / "temp"
        if not temp_dir.exists():
            return 0
        
        deleted_count = 0
        max_age_seconds = max_age_hours * 3600
        current_time = time.time()
        
        for file_path in temp_dir.iterdir():
            if file_path.is_file():
                file_age = current_time - file_path.stat().st_mtime
                if file_age > max_age_seconds:
                    try:
                        file_path.unlink()
                        deleted_count += 1
                        logger.info("Cleaned up temp file: %s", file_path)
                    except IOError as e:
                        logger.warning("Failed to delete temp file: %s", e)
        
        return deleted_count


# Singleton instance
_storage_service: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    """Get or create the storage service singleton."""
    global _storage_service
    if _storage_service is None:
        _storage_service = StorageService()
    return _storage_service
