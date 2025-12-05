/**
 * Custom hook for browser-based Speech Recognition
 * Uses webkitSpeechRecognition (Chrome) or SpeechRecognition (Firefox/Edge)
 * 
 * Flow: Browser STT → Text → Send to Backend LLM → Process Order
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { localeSttCodes, type Locale } from "@/locales";

// Type definitions for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export interface UseSpeechRecognitionOptions {
  /** Locale code (id, en, jv, su) - will be converted to STT language code */
  locale?: Locale;
  /** Language code override (e.g., "id-ID", "en-US") - takes precedence over locale */
  language?: string;
  /** Whether to return interim results while speaking */
  interimResults?: boolean;
  /** Whether to keep listening continuously until manually stopped */
  continuous?: boolean;
  /** Callback when transcription is complete */
  onResult?: (transcript: string) => void;
  /** Callback for interim results (while speaking) */
  onInterimResult?: (transcript: string) => void;
  /** Callback for errors */
  onError?: (error: string) => void;
}

export interface UseSpeechRecognitionReturn {
  /** Whether speech recognition is supported in the browser */
  isSupported: boolean;
  /** Whether currently listening */
  isListening: boolean;
  /** Current transcript (interim or final) */
  transcript: string;
  /** Final transcript (only when speech ends) */
  finalTranscript: string;
  /** Any error message */
  error: string | null;
  /** Start listening */
  startListening: () => void;
  /** Stop listening */
  stopListening: () => void;
  /** Reset transcript and errors */
  reset: () => void;
}

/**
 * Hook for browser-based speech recognition
 * Uses free browser APIs (Chrome's webkitSpeechRecognition)
 */
export function useSpeechRecognition({
  locale = "id",
  language,
  interimResults = true,
  continuous = true,
  onResult,
  onInterimResult,
  onError,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  // Determine the actual language code to use
  // Priority: explicit language > locale mapping > default
  const languageCode = language || localeSttCodes[locale] || "id-ID";
  // Start with true to avoid hydration mismatch, then check on client
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Check browser support after mount (client-side only)
  useEffect(() => {
    const supported = typeof window !== "undefined" && 
      !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    setIsSupported(supported);
  }, []);

  const shouldRestartRef = useRef(false);
  const accumulatedFinalRef = useRef("");

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = continuous; // Keep listening if true
    recognition.interimResults = interimResults;
    recognition.lang = languageCode;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      // Only reset transcript if not restarting
      if (!shouldRestartRef.current) {
        setTranscript("");
        setFinalTranscript("");
        accumulatedFinalRef.current = "";
      }
      shouldRestartRef.current = false;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let currentInterim = "";
      let newFinal = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        
        if (result.isFinal) {
          newFinal += text;
        } else {
          currentInterim += text;
        }
      }

      // Accumulate final results
      if (newFinal) {
        accumulatedFinalRef.current += (accumulatedFinalRef.current ? " " : "") + newFinal.trim();
        setFinalTranscript(accumulatedFinalRef.current);
        setTranscript(accumulatedFinalRef.current);
        
        // Call onResult callback with new final text
        if (onResult) {
          onResult(newFinal.trim());
        }
      }
      
      // Show interim results (accumulated final + current interim)
      if (currentInterim) {
        const displayText = accumulatedFinalRef.current 
          ? accumulatedFinalRef.current + " " + currentInterim
          : currentInterim;
        setTranscript(displayText);
        
        if (onInterimResult) {
          onInterimResult(displayText);
        }
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = "Speech recognition error";
      
      // Determine if we should use Indonesian-style messages
      const useIndonesian = locale === "id" || locale === "jv" || locale === "su";
      
      switch (event.error) {
        case "no-speech":
          errorMessage = useIndonesian 
            ? "Tidak ada suara terdeteksi. Silakan coba lagi."
            : "No speech detected. Please try again.";
          break;
        case "audio-capture":
          errorMessage = useIndonesian
            ? "Mikrofon tidak tersedia. Periksa izin mikrofon."
            : "Microphone not available. Check microphone permissions.";
          break;
        case "not-allowed":
          errorMessage = useIndonesian
            ? "Izin mikrofon ditolak. Silakan izinkan akses mikrofon."
            : "Microphone permission denied. Please allow microphone access.";
          break;
        case "network":
          errorMessage = useIndonesian
            ? "Koneksi jaringan bermasalah."
            : "Network connection error.";
          break;
        case "aborted":
          // User stopped, not an error
          errorMessage = "";
          break;
        default:
          errorMessage = useIndonesian
            ? `Error: ${event.error}`
            : `Error: ${event.error}`;
      }

      if (errorMessage) {
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
      }
      
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if still should be listening (continuous mode)
      if (shouldRestartRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          return; // Don't set isListening to false
        } catch {
          // Failed to restart, stop listening
        }
      }
      setIsListening(false);
    };

    recognition.onspeechend = () => {
      // Speech ended but recognition might continue
      // This is where we might want to restart in continuous mode
    };

    return recognition;
  }, [languageCode, locale, interimResults, continuous, onResult, onInterimResult, onError]);

  // Start listening
  const startListening = useCallback(() => {
    const useIndonesian = locale === "id" || locale === "jv" || locale === "su";
    
    if (!isSupported) {
      const msg = useIndonesian
        ? "Browser tidak mendukung speech recognition. Gunakan Chrome untuk fitur ini."
        : "Browser does not support speech recognition. Use Chrome for this feature.";
      setError(msg);
      if (onError) onError(msg);
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    // Reset accumulated transcript for fresh session
    accumulatedFinalRef.current = "";
    setTranscript("");
    setFinalTranscript("");
    setError(null);

    // Create new recognition instance
    const recognition = initRecognition();
    if (recognition) {
      recognitionRef.current = recognition;
      
      try {
        if (continuous) {
          shouldRestartRef.current = true;
        }
        recognition.start();
      } catch (err) {
        setError(
          useIndonesian
            ? "Gagal memulai pengenalan suara."
            : "Failed to start speech recognition."
        );
      }
    }
  }, [isSupported, locale, initRecognition, onError, continuous]);

  // Stop listening
  const stopListening = useCallback(() => {
    shouldRestartRef.current = false; // Prevent auto-restart
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    shouldRestartRef.current = false;
    accumulatedFinalRef.current = "";
    setTranscript("");
    setFinalTranscript("");
    setError(null);
    
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    finalTranscript,
    error,
    startListening,
    stopListening,
    reset,
  };
}

export default useSpeechRecognition;
