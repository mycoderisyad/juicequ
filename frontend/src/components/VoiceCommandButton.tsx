"use client";

/**
 * Floating Voice Command Button
 * Advanced voice control with support for:
 * - Adding items to cart
 * - Removing items from cart  
 * - Navigation (products, cart, checkout, etc.)
 * - Product search & filtering
 * - General inquiries
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2, ShoppingCart, X, Volume2, Navigation, Trash2, Search, CheckCircle } from "lucide-react";
import { useVoiceCommand, VoiceCommandResult, VoiceCommandType } from "@/hooks/use-voice-command";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface VoiceCommandButtonProps {
  className?: string;
  show?: boolean;
}

// Get icon based on command type
function getCommandIcon(command: VoiceCommandType) {
  switch (command) {
    case "add_to_cart":
      return <ShoppingCart className="w-4 h-4 text-white" />;
    case "remove_from_cart":
    case "clear_cart":
      return <Trash2 className="w-4 h-4 text-white" />;
    case "navigate":
    case "checkout":
      return <Navigation className="w-4 h-4 text-white" />;
    case "search":
    case "filter":
      return <Search className="w-4 h-4 text-white" />;
    default:
      return <CheckCircle className="w-4 h-4 text-white" />;
  }
}

// Get toast color based on command type
function getToastStyle(command: VoiceCommandType, success: boolean) {
  if (!success) {
    return { bg: "bg-red-50", border: "border-red-200", text: "text-red-800", subtext: "text-red-600", iconBg: "bg-red-500" };
  }
  
  switch (command) {
    case "add_to_cart":
      return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", subtext: "text-emerald-600", iconBg: "bg-emerald-500" };
    case "remove_from_cart":
    case "clear_cart":
      return { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", subtext: "text-orange-600", iconBg: "bg-orange-500" };
    case "navigate":
    case "checkout":
      return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", subtext: "text-blue-600", iconBg: "bg-blue-500" };
    case "search":
    case "filter":
      return { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-800", subtext: "text-purple-600", iconBg: "bg-purple-500" };
    default:
      return { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-800", subtext: "text-gray-600", iconBg: "bg-gray-500" };
  }
}

export function VoiceCommandButton({ className, show = true }: VoiceCommandButtonProps) {
  const { locale } = useTranslation();
  
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState<VoiceCommandResult | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showHelpTooltip, setShowHelpTooltip] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Drag state
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  // Get title based on command type
  const getToastTitle = useCallback((result: VoiceCommandResult) => {
    if (!result.success) {
      return locale === "id" ? "Tidak Dapat Memproses" : "Could Not Process";
    }
    
    switch (result.command) {
      case "add_to_cart":
        return locale === "id" ? "Ditambahkan ke Keranjang" : "Added to Cart";
      case "remove_from_cart":
        return locale === "id" ? "Dihapus dari Keranjang" : "Removed from Cart";
      case "clear_cart":
        return locale === "id" ? "Keranjang Dikosongkan" : "Cart Cleared";
      case "navigate":
      case "checkout":
        return locale === "id" ? "Mengarahkan..." : "Navigating...";
      case "search":
        return locale === "id" ? "Mencari Produk..." : "Searching Products...";
      case "filter":
        return locale === "id" ? "Menampilkan Hasil..." : "Showing Results...";
      default:
        return locale === "id" ? "Perintah Diproses" : "Command Processed";
    }
  }, [locale]);

  const handleSuccess = useCallback((result: VoiceCommandResult) => {
    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    setToastData(result);
    setShowToast(true);
    setShowTranscript(false);
    
    // Longer duration for success (8 seconds)
    toastTimeoutRef.current = setTimeout(() => setShowToast(false), 8000);
  }, []);

  const handleError = useCallback((error: string) => {
    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    setToastData({
      success: false,
      command: "unknown",
      message: error,
      transcript: "",
    });
    setShowToast(true);
    setShowTranscript(false);
    
    // 6 seconds for error
    toastTimeoutRef.current = setTimeout(() => setShowToast(false), 6000);
  }, []);

  const {
    isSupported,
    isListening,
    isProcessing,
    transcript,
    startListening,
    stopAndProcess,
    cancel,
  } = useVoiceCommand({
    language: locale === "id" ? "id-ID" : "en-US",
    onSuccess: handleSuccess,
    onError: handleError,
  });

  // Handle press start
  const handlePressStart = useCallback(() => {
    if (!isSupported || isProcessing) return;
    
    isHoldingRef.current = true;
    setShowToast(false);
    setToastData(null);
    setShowTranscript(true);
    
    holdTimeoutRef.current = setTimeout(() => {
      if (isHoldingRef.current) {
        startListening();
      }
    }, 150);
  }, [isSupported, isProcessing, startListening]);

  // Handle press end
  const handlePressEnd = useCallback(async () => {
    isHoldingRef.current = false;
    
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }

    if (isListening) {
      await stopAndProcess();
    } else {
      setShowTranscript(false);
    }
  }, [isListening, stopAndProcess]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    isHoldingRef.current = false;
    isDraggingRef.current = false;
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }
    cancel();
    setShowTranscript(false);
    setIsAnimating(true);
    setDragOffset({ x: 0, y: 0 });
    setTimeout(() => setIsAnimating(false), 300);
  }, [cancel]);

  // Drag handlers
  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current || !isListening) return;
    
    setDragOffset({
      x: dragStartRef.current.offsetX + (clientX - dragStartRef.current.x),
      y: dragStartRef.current.offsetY + (clientY - dragStartRef.current.y),
    });
  }, [isListening]);

  const handleMouseMove = useCallback((e: MouseEvent) => handlePointerMove(e.clientX, e.clientY), [handlePointerMove]);
  const handleMouseUp = useCallback(() => { isDraggingRef.current = false; }, []);
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
  }, [handlePointerMove]);
  const handleTouchEndGlobal = useCallback(() => { isDraggingRef.current = false; }, []);

  useEffect(() => {
    if (isListening) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEndGlobal);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEndGlobal);
      };
    }
  }, [isListening, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEndGlobal]);

  const startDrag = useCallback((clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: clientX, y: clientY, offsetX: dragOffset.x, offsetY: dragOffset.y };
  }, [dragOffset]);

  useEffect(() => {
    if (!isListening && !isProcessing) {
      requestAnimationFrame(() => {
        setIsAnimating(true);
        setDragOffset({ x: 0, y: 0 });
      });
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isListening, isProcessing]);

  const closeToast = useCallback(() => {
    setShowToast(false);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  if (!show || !isSupported || isHidden) return null;

  const isActive = isListening || isProcessing;
  const style = toastData ? getToastStyle(toastData.command, toastData.success) : null;

  return (
    <>
      {/* Floating Button Container */}
      <div 
        className={cn("fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3", className)}
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
          transition: isAnimating ? "transform 0.3s ease-out" : "none",
        }}
      >
        {/* Transcript Bubble */}
        {showTranscript && (isListening || isProcessing || transcript) && (
          <div className="max-w-xs animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 relative">
              <button
                onClick={handleCancel}
                className="absolute -top-2 -right-2 w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3 text-gray-600" />
              </button>
              
              <div className="flex items-center gap-2 mb-2">
                {isListening && (
                  <>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    <span className="text-sm font-medium text-red-600">
                      {locale === "id" ? "Mendengarkan..." : "Listening..."}
                    </span>
                  </>
                )}
                {isProcessing && (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-600">
                      {locale === "id" ? "Memproses..." : "Processing..."}
                    </span>
                  </>
                )}
                {!isListening && !isProcessing && transcript && (
                  <>
                    <Volume2 className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">
                      {locale === "id" ? "Terdeteksi:" : "Detected:"}
                    </span>
                  </>
                )}
              </div>
              
              <p className="text-gray-800 text-sm leading-relaxed min-h-8">
                {transcript || (
                  <span className="text-gray-400 italic">
                    {locale === "id" ? "Ucapkan perintah..." : "Say a command..."}
                  </span>
                )}
              </p>
              
              {isListening && (
                <div className="text-xs text-gray-400 mt-3 space-y-1">
                  <p>{locale === "id" ? "Contoh perintah:" : "Example commands:"}</p>
                  <p className="text-gray-500">• {locale === "id" ? '"Beli Berry Blast 2"' : '"Buy Berry Blast 2"'}</p>
                  <p className="text-gray-500">• {locale === "id" ? '"Hapus keranjang"' : '"Clear cart"'}</p>
                  <p className="text-gray-500">• {locale === "id" ? '"Ke checkout"' : '"Go to checkout"'}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end pr-6">
              <div className="w-3 h-3 bg-white border-r border-b border-gray-100 transform rotate-45 -mt-1.5"></div>
            </div>
          </div>
        )}

        {/* Main Floating Button */}
        <button
          onMouseDown={(e) => { handlePressStart(); startDrag(e.clientX, e.clientY); }}
          onMouseUp={handlePressEnd}
          onMouseLeave={() => { if (isHoldingRef.current && !isListening) handleCancel(); }}
          onTouchStart={(e) => { handlePressStart(); if (e.touches.length > 0) startDrag(e.touches[0].clientX, e.touches[0].clientY); }}
          onTouchEnd={handlePressEnd}
          disabled={isProcessing}
          className={cn(
            "relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 select-none touch-none",
            isActive
              ? "bg-red-500 hover:bg-red-600 scale-110 shadow-red-500/30"
              : "bg-emerald-600 hover:bg-emerald-700 hover:scale-105 shadow-emerald-600/30",
            isProcessing && "bg-emerald-600 cursor-wait",
            "active:scale-95",
            isListening && "cursor-grabbing"
          )}
          aria-label={locale === "id" ? "Tekan dan tahan untuk perintah suara" : "Press and hold for voice command"}
        >
          {isListening && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30"></span>
              <span className="absolute inset-0 rounded-full bg-red-400 animate-pulse opacity-20"></span>
            </>
          )}
          
          {isProcessing ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : isListening ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Hide control */}
        <div className="flex justify-end w-full">
          <button
            type="button"
            onClick={() => setIsHidden(true)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline"
            aria-label={locale === "id" ? "Sembunyikan tombol suara" : "Hide voice button"}
          >
            {locale === "id" ? "Sembunyikan" : "Hide"}
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {showToast && toastData && style && (
        <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
          <div className={cn("max-w-sm rounded-2xl shadow-xl border p-4", style.bg, style.border)}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", style.iconBg)}>
                  {getCommandIcon(toastData.command)}
                </div>
                <div>
                  <h4 className={cn("font-semibold text-sm", style.text)}>
                    {getToastTitle(toastData)}
                  </h4>
                  <p className={cn("text-xs mt-0.5 max-w-[200px]", style.subtext)}>
                    {toastData.message}
                  </p>
                </div>
              </div>
              <button onClick={closeToast} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Order Items Preview */}
            {toastData.command === "add_to_cart" && toastData.items && toastData.items.length > 0 && (
              <div className="mt-3 pt-3 border-t border-emerald-200 space-y-2">
                {toastData.items.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-emerald-800">{item.quantity}x {item.product_name}</span>
                    <span className="text-emerald-600 font-medium">Rp {item.total_price.toLocaleString("id-ID")}</span>
                  </div>
                ))}
                {toastData.items.length > 3 && (
                  <p className="text-xs text-emerald-500">
                    +{toastData.items.length - 3} {locale === "id" ? "item lainnya" : "more items"}
                  </p>
                )}
              </div>
            )}

            {/* Action Button */}
            {toastData.success && toastData.command === "add_to_cart" && (
              <a
                href="/checkout"
                className="mt-3 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                {locale === "id" ? "Checkout Sekarang" : "Checkout Now"}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Help tooltip */}
      {!isActive && !showToast && showHelpTooltip && (
        <div className="fixed bottom-6 right-24 z-40 hidden lg:block pointer-events-none opacity-60">
          <div className="bg-gray-900/90 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm pointer-events-auto flex items-start gap-2">
            <span>
              {locale === "id" ? "Tekan & tahan untuk perintah suara" : "Press & hold for voice command"}
            </span>
            <button
              type="button"
              onClick={() => setShowHelpTooltip(false)}
              className="text-white/70 hover:text-white transition-colors"
              aria-label={locale === "id" ? "Tutup petunjuk suara" : "Dismiss voice hint"}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default VoiceCommandButton;
