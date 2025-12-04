"""
Speech-to-Text Service.
Handles audio transcription using Google Cloud Speech-to-Text.
"""
import logging
import os
import tempfile
from typing import Optional

logger = logging.getLogger(__name__)


class STTService:
    """Service for Speech-to-Text operations."""
    
    def __init__(self, credentials_path: Optional[str] = None):
        """
        Initialize STT service.
        
        Args:
            credentials_path: Optional path to Google Cloud credentials JSON file
        """
        self.client = None
        self._initialized = False
        
        # Try to initialize Google Cloud Speech client
        try:
            from google.cloud import speech_v1 as speech
            
            if credentials_path and os.path.exists(credentials_path):
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = credentials_path
            
            self.client = speech.SpeechClient()
            self._initialized = True
            logger.info("Google Cloud Speech-to-Text client initialized successfully")
        except ImportError:
            logger.warning("google-cloud-speech not installed. STT will use fallback.")
        except Exception as e:
            logger.warning(f"Could not initialize Google Cloud STT: {e}. Using fallback.")
    
    async def transcribe(
        self,
        audio_data: bytes,
        language: str = "id-ID",
        encoding: str = "WEBM_OPUS",
        sample_rate: int = 48000,
    ) -> str:
        """
        Transcribe audio to text.
        
        Args:
            audio_data: Binary audio data
            language: Language code (default: Indonesian)
            encoding: Audio encoding format (WEBM_OPUS, LINEAR16, FLAC, etc.)
            sample_rate: Audio sample rate in Hz
        
        Returns:
            Transcribed text
        """
        if not self._initialized or not self.client:
            logger.warning("STT client not available, using fallback transcription")
            return await self._fallback_transcribe(audio_data, language)
        
        try:
            from google.cloud import speech_v1 as speech
            
            # Map encoding string to enum
            encoding_map = {
                "WEBM_OPUS": speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                "LINEAR16": speech.RecognitionConfig.AudioEncoding.LINEAR16,
                "FLAC": speech.RecognitionConfig.AudioEncoding.FLAC,
                "OGG_OPUS": speech.RecognitionConfig.AudioEncoding.OGG_OPUS,
                "MP3": speech.RecognitionConfig.AudioEncoding.MP3,
            }
            
            audio_encoding = encoding_map.get(encoding, speech.RecognitionConfig.AudioEncoding.WEBM_OPUS)
            
            # Configure recognition
            config = speech.RecognitionConfig(
                encoding=audio_encoding,
                sample_rate_hertz=sample_rate,
                language_code=language,
                enable_automatic_punctuation=True,
                model="latest_short",  # Optimized for short audio clips
                use_enhanced=True,  # Use enhanced model for better accuracy
            )
            
            audio = speech.RecognitionAudio(content=audio_data)
            
            # Perform synchronous transcription
            response = self.client.recognize(config=config, audio=audio)
            
            # Extract transcription
            transcription = ""
            for result in response.results:
                if result.alternatives:
                    transcription += result.alternatives[0].transcript + " "
            
            transcription = transcription.strip()
            
            if transcription:
                logger.info(f"Successfully transcribed audio: {transcription[:100]}...")
                return transcription
            else:
                logger.warning("No transcription results returned")
                return await self._fallback_transcribe(audio_data, language)
                
        except Exception as e:
            logger.error(f"Error during transcription: {e}")
            return await self._fallback_transcribe(audio_data, language)
    
    async def _fallback_transcribe(self, audio_data: bytes, language: str) -> str:
        """
        Fallback transcription when Google Cloud STT is not available.
        Uses a simple keyword-based response for demo purposes.
        
        In production, you should configure proper Google Cloud credentials.
        """
        # For demo/development, return a helpful message
        if language.startswith("id"):
            return "[Fitur voice ordering membutuhkan konfigurasi Google Cloud Speech-to-Text. Silakan ketik pesanan Anda.]"
        else:
            return "[Voice ordering requires Google Cloud Speech-to-Text configuration. Please type your order instead.]"
    
    async def close(self) -> None:
        """Clean up resources."""
        if self.client:
            try:
                # Google Cloud clients don't require explicit cleanup
                # but we can set to None to release reference
                self.client = None
                self._initialized = False
            except Exception as e:
                logger.warning(f"Error closing STT client: {e}")
