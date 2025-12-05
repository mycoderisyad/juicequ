"""
Speech-to-Text Service.
Handles audio transcription using Google Cloud Speech-to-Text.
Supports multiple languages including regional Indonesian languages.
"""
import logging
import os
from typing import Optional

from app.services.ai.locales import (
    get_stt_language_code,
    get_fallback_message,
    get_locale_config,
)

logger = logging.getLogger(__name__)


class STTService:
    """Service for Speech-to-Text operations with multi-locale support."""
    
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
        locale: str = "id",
        encoding: str = "WEBM_OPUS",
        sample_rate: int = 48000,
    ) -> str:
        """
        Transcribe audio to text.
        
        Args:
            audio_data: Binary audio data
            locale: Locale code (id, en, jv, su)
            encoding: Audio encoding format (WEBM_OPUS, LINEAR16, FLAC, etc.)
            sample_rate: Audio sample rate in Hz
        
        Returns:
            Transcribed text
        """
        # Get STT language code for the locale
        language_code = get_stt_language_code(locale)
        locale_config = get_locale_config(locale)
        
        if not self._initialized or not self.client:
            logger.warning("STT client not available, using fallback transcription")
            return await self._fallback_transcribe(locale)
        
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
            
            # Try primary language code first
            transcription = await self._try_transcribe(
                audio_data=audio_data,
                language_code=language_code,
                audio_encoding=audio_encoding,
                sample_rate=sample_rate,
            )
            
            # If no result and we have alternative codes, try them
            if not transcription and locale_config.alternative_stt_codes:
                for alt_code in locale_config.alternative_stt_codes:
                    if alt_code != language_code:
                        logger.info(f"Trying alternative STT code: {alt_code}")
                        transcription = await self._try_transcribe(
                            audio_data=audio_data,
                            language_code=alt_code,
                            audio_encoding=audio_encoding,
                            sample_rate=sample_rate,
                        )
                        if transcription:
                            break
            
            if transcription:
                logger.info(f"Successfully transcribed audio ({locale}): {transcription[:100]}...")
                return transcription
            else:
                logger.warning(f"No transcription results returned for locale: {locale}")
                return await self._fallback_transcribe(locale)
                
        except Exception as e:
            logger.error(f"Error during transcription: {e}")
            return await self._fallback_transcribe(locale)
    
    async def _try_transcribe(
        self,
        audio_data: bytes,
        language_code: str,
        audio_encoding,
        sample_rate: int,
    ) -> str:
        """
        Attempt transcription with specific language code.
        
        Returns:
            Transcribed text or empty string if failed
        """
        try:
            from google.cloud import speech_v1 as speech
            
            # Configure recognition with language-specific settings
            config = speech.RecognitionConfig(
                encoding=audio_encoding,
                sample_rate_hertz=sample_rate,
                language_code=language_code,
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
            
            return transcription.strip()
            
        except Exception as e:
            logger.warning(f"Transcription failed for {language_code}: {e}")
            return ""
    
    async def transcribe_with_alternatives(
        self,
        audio_data: bytes,
        locale: str = "id",
        encoding: str = "WEBM_OPUS",
        sample_rate: int = 48000,
        max_alternatives: int = 3,
    ) -> list[dict]:
        """
        Transcribe audio and return multiple alternatives with confidence scores.
        Useful for regional languages where accuracy may vary.
        
        Args:
            audio_data: Binary audio data
            locale: Locale code
            encoding: Audio encoding format
            sample_rate: Audio sample rate in Hz
            max_alternatives: Maximum number of alternatives to return
        
        Returns:
            List of dicts with 'transcript' and 'confidence' keys
        """
        language_code = get_stt_language_code(locale)
        
        if not self._initialized or not self.client:
            return [{"transcript": await self._fallback_transcribe(locale), "confidence": 0.0}]
        
        try:
            from google.cloud import speech_v1 as speech
            
            encoding_map = {
                "WEBM_OPUS": speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
                "LINEAR16": speech.RecognitionConfig.AudioEncoding.LINEAR16,
                "FLAC": speech.RecognitionConfig.AudioEncoding.FLAC,
                "OGG_OPUS": speech.RecognitionConfig.AudioEncoding.OGG_OPUS,
                "MP3": speech.RecognitionConfig.AudioEncoding.MP3,
            }
            
            audio_encoding = encoding_map.get(encoding, speech.RecognitionConfig.AudioEncoding.WEBM_OPUS)
            
            config = speech.RecognitionConfig(
                encoding=audio_encoding,
                sample_rate_hertz=sample_rate,
                language_code=language_code,
                enable_automatic_punctuation=True,
                model="latest_short",
                use_enhanced=True,
                max_alternatives=max_alternatives,
            )
            
            audio = speech.RecognitionAudio(content=audio_data)
            response = self.client.recognize(config=config, audio=audio)
            
            alternatives = []
            for result in response.results:
                for alt in result.alternatives:
                    alternatives.append({
                        "transcript": alt.transcript,
                        "confidence": alt.confidence,
                    })
            
            if alternatives:
                return alternatives
            else:
                return [{"transcript": await self._fallback_transcribe(locale), "confidence": 0.0}]
                
        except Exception as e:
            logger.error(f"Error during transcription with alternatives: {e}")
            return [{"transcript": await self._fallback_transcribe(locale), "confidence": 0.0}]
    
    async def _fallback_transcribe(self, locale: str) -> str:
        """
        Fallback transcription when Google Cloud STT is not available.
        
        In production, you should configure proper Google Cloud credentials.
        """
        return f"[{get_fallback_message(locale, 'stt_unavailable')}]"
    
    def get_supported_languages(self) -> list[dict]:
        """
        Get list of supported languages for STT.
        
        Returns:
            List of dicts with locale info
        """
        from app.services.ai.locales import SUPPORTED_LOCALES
        
        return [
            {
                "code": config.code,
                "name": config.name,
                "stt_code": config.stt_code,
                "flag": config.flag,
                "is_regional": config.is_regional,
            }
            for config in SUPPORTED_LOCALES.values()
        ]
    
    async def close(self) -> None:
        """Clean up resources."""
        if self.client:
            try:
                self.client = None
                self._initialized = False
            except Exception as e:
                logger.warning(f"Error closing STT client: {e}")
