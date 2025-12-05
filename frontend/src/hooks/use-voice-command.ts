/**
 * Voice Command Hook
 * Advanced voice control for JuiceQu with support for:
 * - Adding items to cart
 * - Removing items from cart
 * - Navigation (products, cart, checkout, etc.)
 * - Product search & filtering
 * - General inquiries
 */

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSpeechRecognition } from "./use-speech-recognition";
import aiApi from "@/lib/api/ai";
import { useCartStore } from "@/lib/store";

// Voice command types
export type VoiceCommandType = 
  | "add_to_cart"      // Add items to cart
  | "remove_from_cart" // Remove items from cart
  | "clear_cart"       // Clear entire cart
  | "navigate"         // Navigate to a page
  | "search"           // Search products
  | "filter"           // Filter/sort products
  | "checkout"         // Go to checkout
  | "inquiry"          // General question
  | "unknown";         // Could not determine intent

export interface VoiceCommandItem {
  product_id: string;
  product_name: string;
  quantity: number;
  size: "small" | "medium" | "large";
  unit_price: number;
  total_price: number;
  image_url?: string;
}

export interface VoiceCommandResult {
  success: boolean;
  command: VoiceCommandType;
  message: string;
  transcript: string;
  // For add_to_cart
  items?: VoiceCommandItem[];
  // For navigate
  destination?: string;
  // For search/filter
  searchQuery?: string;
  sortBy?: "price_asc" | "price_desc" | "name" | "popular";
  filterCategory?: string;
  // For remove
  removeProductName?: string;
}

export interface UseVoiceCommandOptions {
  language?: string;
  onSuccess?: (result: VoiceCommandResult) => void;
  onError?: (error: string) => void;
  onTranscript?: (transcript: string) => void;
}

export interface UseVoiceCommandReturn {
  isSupported: boolean;
  isListening: boolean;
  isProcessing: boolean;
  status: string;
  error: string | null;
  transcript: string;
  lastResult: VoiceCommandResult | null;
  startListening: () => void;
  stopAndProcess: () => Promise<VoiceCommandResult | null>;
  cancel: () => void;
  reset: () => void;
}

// Local intent detection for common commands (faster, no API call needed)
function detectLocalIntent(text: string, locale: string): VoiceCommandResult | null {
  const lower = text.toLowerCase().trim();
  
  // Navigation commands
  const navPatterns: { patterns: RegExp[]; destination: string }[] = [
    { patterns: [/\b(ke|buka|lihat|tampilkan)\s*(halaman\s*)?(beranda|home|utama)\b/i, /\bgo\s*(to)?\s*home\b/i], destination: "/" },
    { patterns: [/\b(ke|buka|lihat|tampilkan)\s*(halaman\s*)?(produk|menu|daftar\s*produk|daftar\s*menu)\b/i, /\b(go\s*(to)?|show|open)\s*(products?|menu)\b/i], destination: "/menu" },
    { patterns: [/\b(ke|buka|lihat|tampilkan)\s*(halaman\s*)?(keranjang|cart)\b/i, /\b(go\s*(to)?|show|open)\s*cart\b/i], destination: "/cart" },
    { patterns: [/\b(ke|buka|lihat|tampilkan)\s*(halaman\s*)?(checkout|pembayaran|bayar)\b/i, /\b(go\s*(to)?)\s*checkout\b/i], destination: "/checkout" },
    { patterns: [/\b(ke|buka|lihat|tampilkan)\s*(halaman\s*)?(tentang|about)\b/i, /\b(go\s*(to)?|show)\s*about\b/i], destination: "/about" },
    { patterns: [/\b(ke|buka|lihat|tampilkan)\s*(halaman\s*)?(chat|ai|asisten)\b/i, /\b(go\s*(to)?|open)\s*chat\b/i], destination: "/chat" },
  ];
  
  for (const { patterns, destination } of navPatterns) {
    if (patterns.some(p => p.test(lower))) {
      return {
        success: true,
        command: "navigate",
        message: locale === "id" ? `Mengarahkan ke ${destination}...` : `Navigating to ${destination}...`,
        transcript: text,
        destination,
      };
    }
  }
  
  // Clear cart command - catch ALL variations of "hapus" related to cart
  const clearCartPatterns = [
    /\b(kosongkan|hapus\s*semua|clear)\s*(keranjang|cart)\b/i,
    /\bclear\s*(all|the)?\s*cart\b/i,
    // Generic "hapus" patterns - catch anything that sounds like clearing cart
    /\b(hapus|hilangkan|buang|remove|delete)\s+(semua\s*)?(produk|pesanan|barang|item|isi|yang)\s*(yang\s+ada\s*)?(di|dari|dalam)?\s*(keranjang|cart)?\s*$/i,
    /\b(hapus|hilangkan|buang|remove|delete)\s+(semua|all)\s*(yang\s+ada\s*)?(di|dari|dalam)?\s*(keranjang|cart)?\s*$/i,
    /\bhapus\s+(semua|semuanya|keranjang)\s*$/i,
    /\bhapus\s+(produk|pesanan|barang|item)\s*$/i,
    /\bhapus\s+yang\s+ada\s+(di|dari)?\s*(keranjang)?\s*$/i,
    // Simple "hapus keranjang" or just "hapus" when context is about cart
    /^(hapus|kosongkan|bersihkan)\s*(keranjang|cart|pesanan)?\s*$/i,
  ];
  
  if (clearCartPatterns.some(p => p.test(lower))) {
    return {
      success: true,
      command: "clear_cart",
      message: locale === "id" ? "Mengosongkan keranjang..." : "Clearing cart...",
      transcript: text,
    };
  }
  
  // Checkout command
  if (/\b(checkout|bayar|proses\s*pesanan|selesaikan\s*pesanan)\b/i.test(lower)) {
    return {
      success: true,
      command: "checkout",
      message: locale === "id" ? "Menuju checkout..." : "Going to checkout...",
      transcript: text,
      destination: "/checkout",
    };
  }
  
  // Sort/filter commands
  const sortPatterns: { patterns: RegExp[]; sortBy: "price_asc" | "price_desc" | "popular" | "name" }[] = [
    { patterns: [/\b(termurah|harga\s*terendah|murah\s*dulu)\b/i, /\b(cheapest|lowest\s*price|price\s*low)\b/i], sortBy: "price_asc" },
    { patterns: [/\b(termahal|harga\s*tertinggi|mahal\s*dulu)\b/i, /\b(most\s*expensive|highest\s*price|price\s*high)\b/i], sortBy: "price_desc" },
    { patterns: [/\b(terpopuler|paling\s*laris|bestseller)\b/i, /\b(most\s*popular|bestseller|best\s*selling)\b/i], sortBy: "popular" },
  ];
  
  for (const { patterns, sortBy } of sortPatterns) {
    if (patterns.some(p => p.test(lower))) {
      return {
        success: true,
        command: "filter",
        message: locale === "id" 
          ? `Menampilkan produk ${sortBy === "price_asc" ? "termurah" : sortBy === "price_desc" ? "termahal" : "terpopuler"}...`
          : `Showing ${sortBy === "price_asc" ? "cheapest" : sortBy === "price_desc" ? "most expensive" : "most popular"} products...`,
        transcript: text,
        sortBy,
        destination: "/menu",
      };
    }
  }
  
  // Remove specific item from cart (must have actual product name, not generic words)
  // This pattern should only match when user mentions a specific product name
  const removeMatch = lower.match(/\b(hapus|hilangkan|buang|remove|delete)\s+([a-zA-Z][a-zA-Z0-9\s]*?)\s*(dari\s*keranjang|from\s*cart)?\s*$/i);
  if (removeMatch) {
    const productName = removeMatch[2].trim();
    // Skip generic words that are not actual product names
    const genericWords = ["produk", "pesanan", "barang", "item", "isi", "semua", "semuanya", "product", "all", "everything"];
    const isGeneric = genericWords.some(w => productName.toLowerCase() === w || productName.toLowerCase().startsWith(w + " "));
    
    if (!isGeneric && productName.length > 1) {
      return {
        success: true,
        command: "remove_from_cart",
        message: locale === "id" ? `Menghapus ${productName} dari keranjang...` : `Removing ${productName} from cart...`,
        transcript: text,
        removeProductName: productName,
      };
    }
  }
  
  // Search command
  const searchMatch = lower.match(/\b(cari|carikan|search|find)\s+(.+)/i);
  if (searchMatch) {
    const query = searchMatch[2].trim();
    return {
      success: true,
      command: "search",
      message: locale === "id" ? `Mencari "${query}"...` : `Searching for "${query}"...`,
      transcript: text,
      searchQuery: query,
      destination: "/menu",
    };
  }
  
  return null; // Need to call API for more complex commands
}

export function useVoiceCommand({
  language = "id-ID",
  onSuccess,
  onError,
  onTranscript,
}: UseVoiceCommandOptions = {}): UseVoiceCommandReturn {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null);
  
  const { addItem, items: cartItems } = useCartStore();
  const sessionIdRef = useRef<string | undefined>(undefined);
  const locale = language.startsWith("id") ? "id" : "en";

  const handleInterimResult = useCallback((fullTranscript: string) => {
    setCurrentTranscript(fullTranscript);
    if (onTranscript) {
      onTranscript(fullTranscript);
    }
  }, [onTranscript]);

  const handleSpeechError = useCallback((errorMsg: string) => {
    if (errorMsg.includes("Tidak ada suara") || errorMsg.includes("No speech")) {
      return; // Ignore no-speech errors
    }
    setError(errorMsg);
    if (onError) {
      onError(errorMsg);
    }
  }, [onError]);

  const {
    isSupported,
    isListening,
    transcript: sttTranscript,
    startListening: startBrowserSTT,
    stopListening: stopBrowserSTT,
    reset: resetBrowserSTT,
  } = useSpeechRecognition({
    language,
    interimResults: true,
    continuous: true,
    onInterimResult: handleInterimResult,
    onError: handleSpeechError,
  });

  // Execute command action
  const executeCommand = useCallback(async (result: VoiceCommandResult) => {
    switch (result.command) {
      case "navigate":
      case "checkout":
        if (result.destination) {
          router.push(result.destination);
        }
        break;
        
      case "clear_cart":
        useCartStore.getState().clearCart();
        result.message = locale === "id" ? "Keranjang dikosongkan!" : "Cart cleared!";
        break;
        
      case "remove_from_cart":
        if (result.removeProductName) {
          // Get current cart items directly from store
          const currentItems = useCartStore.getState().items;
          const itemToRemove = currentItems.find(item => 
            item.name.toLowerCase().includes(result.removeProductName!.toLowerCase())
          );
          if (itemToRemove) {
            useCartStore.getState().removeItem(itemToRemove.id);
            result.message = locale === "id" 
              ? `${itemToRemove.name} dihapus dari keranjang!`
              : `${itemToRemove.name} removed from cart!`;
          } else {
            result.success = false;
            result.message = locale === "id"
              ? `Produk "${result.removeProductName}" tidak ditemukan di keranjang`
              : `Product "${result.removeProductName}" not found in cart`;
          }
        }
        break;
        
      case "filter":
      case "search":
        if (result.destination) {
          let url = result.destination;
          const params = new URLSearchParams();
          
          if (result.sortBy) {
            params.set("sort", result.sortBy);
          }
          if (result.searchQuery) {
            params.set("search", result.searchQuery);
          }
          if (result.filterCategory) {
            params.set("category", result.filterCategory);
          }
          
          if (params.toString()) {
            url += `?${params.toString()}`;
          }
          router.push(url);
        }
        break;
        
      case "add_to_cart":
        // Items already added during processing
        break;
    }
  }, [router, locale, cartItems]);

  const startListening = useCallback(() => {
    setError(null);
    setStatus(locale === "id" ? "Mendengarkan..." : "Listening...");
    setCurrentTranscript("");
    setLastResult(null);
    resetBrowserSTT();
    startBrowserSTT();
  }, [startBrowserSTT, resetBrowserSTT, locale]);

  const stopAndProcess = useCallback(async (): Promise<VoiceCommandResult | null> => {
    stopBrowserSTT();
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const transcriptToProcess = currentTranscript.trim();
    
    if (!transcriptToProcess) {
      const noSpeechMsg = locale === "id" 
        ? "Tidak ada suara terdeteksi. Coba lagi."
        : "No speech detected. Try again.";
      setError(noSpeechMsg);
      setStatus("");
      if (onError) onError(noSpeechMsg);
      return null;
    }

    setStatus(locale === "id" ? "Memproses..." : "Processing...");
    setIsProcessing(true);

    try {
      // First, try local intent detection (faster)
      const localResult = detectLocalIntent(transcriptToProcess, locale);
      
      if (localResult && localResult.command !== "unknown") {
        // Execute the command
        await executeCommand(localResult);
        
        setLastResult(localResult);
        setStatus("");
        setIsProcessing(false);
        
        if (onSuccess) {
          onSuccess(localResult);
        }
        
        return localResult;
      }
      
      // Fall back to Multi-Agent API for complex commands
      const response = await aiApi.sendChatMessage({
        message: transcriptToProcess,
        session_id: sessionIdRef.current,
        locale,
      });

      sessionIdRef.current = response.session_id;
      
      // Map API intent to voice command type
      const intentMap: Record<string, VoiceCommandType> = {
        "add_to_cart": "add_to_cart",
        "remove_from_cart": "remove_from_cart",
        "clear_cart": "clear_cart",
        "navigate": "navigate",
        "checkout": "checkout",
        "search": "search",
        "filter": "filter",
        "recommendation": "inquiry",
        "product_info": "inquiry",
        "greeting": "inquiry",
        "inquiry": "inquiry",
        "off_topic": "unknown",
      };
      
      const command = intentMap[response.intent || "inquiry"] || "inquiry";
      
      // Handle navigation from API
      if (response.should_navigate && response.destination) {
        router.push(response.destination);
        
        const result: VoiceCommandResult = {
          success: true,
          command: "navigate",
          message: response.response,
          transcript: transcriptToProcess,
          destination: response.destination,
        };
        
        setLastResult(result);
        setStatus("");
        setIsProcessing(false);
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        return result;
      }

      // Handle order data (add to cart)
      if (response.order_data && response.order_data.items && response.order_data.items.length > 0) {
        const validItems: VoiceCommandItem[] = [];
        
        for (const item of response.order_data.items) {
          if (!item.product_id || !item.product_name || !item.unit_price || item.unit_price <= 0) {
            continue;
          }
          
          const quantity = item.quantity > 0 ? item.quantity : 1;
          const size = item.size || "medium";
          const unitPrice = Number(item.unit_price);
          
          if (unitPrice <= 0) continue;
          
          // Add to cart using @/lib/store format
          addItem({
            id: String(item.product_id),
            name: String(item.product_name),
            price: unitPrice,
            quantity,
            image: item.image_url || undefined,
          });
          
          validItems.push({
            product_id: String(item.product_id),
            product_name: String(item.product_name),
            quantity,
            size: size as "small" | "medium" | "large",
            unit_price: unitPrice,
            total_price: unitPrice * quantity,
            image_url: item.image_url,
          });
        }
        
        if (validItems.length > 0) {
          const result: VoiceCommandResult = {
            success: true,
            command: "add_to_cart",
            message: response.response,
            transcript: transcriptToProcess,
            items: validItems,
          };
          
          setLastResult(result);
          setStatus(locale === "id" ? "Ditambahkan ke keranjang!" : "Added to cart!");
          setIsProcessing(false);
          
          if (onSuccess) {
            onSuccess(result);
          }
          
          return result;
        }
      }
      
      // Handle off-topic rejection
      if (response.intent === "off_topic") {
        const result: VoiceCommandResult = {
          success: false,
          command: "unknown",
          message: response.response,
          transcript: transcriptToProcess,
        };
        
        setLastResult(result);
        setStatus("");
        setIsProcessing(false);
        
        if (onError) {
          onError(response.response);
        }
        
        return result;
      }
      
      // General response (recommendations, inquiries, etc.)
      const result: VoiceCommandResult = {
        success: true,
        command,
        message: response.response || (locale === "id" 
          ? "Maaf, saya tidak mengerti perintah tersebut."
          : "Sorry, I didn't understand that command."),
        transcript: transcriptToProcess,
      };
      
      setLastResult(result);
      setStatus("");
      setIsProcessing(false);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
      
    } catch (err) {
      console.error("[Voice Command] Error:", err);
      const errorMsg = locale === "id"
        ? "Gagal memproses perintah. Silakan coba lagi."
        : "Failed to process command. Please try again.";
      
      setError(errorMsg);
      setStatus("");
      setIsProcessing(false);
      
      if (onError) {
        onError(errorMsg);
      }
      
      return null;
    }
  }, [stopBrowserSTT, currentTranscript, locale, executeCommand, addItem, onSuccess, onError, cartItems]);

  const cancel = useCallback(() => {
    stopBrowserSTT();
    setStatus("");
    setIsProcessing(false);
    setCurrentTranscript("");
  }, [stopBrowserSTT]);

  const reset = useCallback(() => {
    resetBrowserSTT();
    setStatus("");
    setError(null);
    setIsProcessing(false);
    setCurrentTranscript("");
    setLastResult(null);
  }, [resetBrowserSTT]);

  const displayTranscript = isListening && sttTranscript ? sttTranscript : currentTranscript;

  return {
    isSupported,
    isListening,
    isProcessing,
    status,
    error,
    transcript: displayTranscript,
    lastResult,
    startListening,
    stopAndProcess,
    cancel,
    reset,
  };
}

export default useVoiceCommand;
