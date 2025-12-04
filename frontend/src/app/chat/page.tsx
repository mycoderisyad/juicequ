"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, User, Bot, Mic, MicOff, Loader2, AlertCircle, ShoppingCart } from "lucide-react";
import aiApi, { ChatResponse, ChatOrderData, ChatMessageHistory, FeaturedProduct } from "@/lib/api/ai";
import { useAuthStore } from "@/store/auth-store";
import { useTranslation } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
  isError?: boolean;
  responseTimeMs?: number;
  orderData?: ChatOrderData;
  showCheckout?: boolean;
  featuredProducts?: FeaturedProduct[];
}

const SUGGESTIONS_EN = [
  "What's your bestseller?",
  "Show me healthy options",
  "I want to buy Berry Blast",
  "Order 2 Acai Mango",
  "Recommend something",
];

const SUGGESTIONS_ID = [
  "Apa yang paling laris?",
  "Pilihan sehat dong",
  "Beli Berry Blast 1",
  "Pesan Acai Mango 2",
  "Rekomendasikan sesuatu",
];

function useChat(locale: string) {
  const getInitialMessage = useCallback((): Message => ({
    id: 1,
    role: "assistant",
    content: locale === "en" 
      ? "Hi there! I'm your JuiceQu AI assistant. I can help you find the perfect smoothie or place an order directly! Just tell me what you'd like, for example: 'I want to buy 2 Acai Mango'."
      : "Halo! Saya asisten AI JuiceQu. Saya bisa membantu Anda menemukan smoothie yang sempurna atau langsung memesan! Cukup bilang apa yang Anda mau, contoh: 'Beli Acai Mango 2'.",
  }), [locale]);

  const [messages, setMessages] = useState<Message[]>(() => [getInitialMessage()]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update initial message when locale changes
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].role === "assistant") {
        return [getInitialMessage()];
      }
      return prev;
    });
  }, [locale, getInitialMessage]);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const updateMessage = (id: number, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  };

  // Build conversation history from messages
  const getConversationHistory = useCallback((): ChatMessageHistory[] => {
    return messages
      .filter(m => !m.isLoading && m.content)
      .map(m => ({
        role: m.role,
        content: m.content,
      }));
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: messages.length + 1, role: "user", content: input };
    const loadingMessageId = messages.length + 2;

    addMessage(userMessage);
    addMessage({ id: loadingMessageId, role: "assistant", content: "", isLoading: true });
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // Include conversation history for context
      const conversationHistory = getConversationHistory();
      
      const response: ChatResponse = await aiApi.sendChatMessage({
        message: input,
        session_id: sessionId,
        locale: locale,
        conversation_history: conversationHistory,
      });
      setSessionId(response.session_id);
      updateMessage(loadingMessageId, {
        content: response.response,
        isLoading: false,
        responseTimeMs: response.response_time_ms,
        orderData: response.order_data,
        showCheckout: response.show_checkout,
        featuredProducts: response.featured_products,
      });
    } catch (err) {
      updateMessage(loadingMessageId, {
        content: locale === "en" 
          ? "Sorry, I couldn't process your request. Please try again."
          : "Maaf, saya tidak bisa memproses permintaan Anda. Silakan coba lagi.",
        isLoading: false,
        isError: true,
      });
      setError(err instanceof Error ? err.message : (locale === "en" ? "Failed to get response" : "Gagal mendapatkan respons"));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages.length, sessionId, locale, getConversationHistory]);

  const processVoice = useCallback(async (audioBlob: Blob) => {
    const userMessageId = messages.length + 1;
    const loadingMessageId = messages.length + 2;

    addMessage({ id: userMessageId, role: "user", content: locale === "en" ? "🎤 Voice message..." : "🎤 Pesan suara...", isLoading: true });
    addMessage({ id: loadingMessageId, role: "assistant", content: "", isLoading: true });
    setIsLoading(true);

    try {
      const response = await aiApi.processVoice(audioBlob, sessionId);
      setSessionId(response.session_id);
      updateMessage(userMessageId, { content: `🎤 "${response.transcription}"`, isLoading: false });
      updateMessage(loadingMessageId, {
        content: response.response,
        isLoading: false,
        responseTimeMs: response.response_time_ms,
      });
    } catch (err) {
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessageId));
      updateMessage(loadingMessageId, {
        content: locale === "en" 
          ? "Sorry, I couldn't process your voice message. Please try again."
          : "Maaf, saya tidak bisa memproses pesan suara Anda. Silakan coba lagi.",
        isLoading: false,
        isError: true,
      });
      setError(err instanceof Error ? err.message : (locale === "en" ? "Failed to process voice" : "Gagal memproses suara"));
    } finally {
      setIsLoading(false);
    }
  }, [messages.length, sessionId, locale]);

  return { messages, input, setInput, isLoading, error, setError, sendMessage, processVoice };
}

function useVoiceRecorder(onRecordingComplete: (blob: Blob) => void, locale: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });

      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => e.data.size > 0 && audioChunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        onRecordingComplete(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingError(null);
    } catch {
      setRecordingError(locale === "en" 
        ? "Could not access microphone. Please check permissions."
        : "Tidak dapat mengakses mikrofon. Silakan periksa izin.");
    }
  }, [onRecordingComplete, locale]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return { isRecording, recordingError, startRecording, stopRecording };
}

function ChatHeader({ isAuthenticated, t }: { isAuthenticated: boolean; t: (key: string) => string }) {
  return (
    <div className="border-b border-gray-100 bg-white p-4 text-center">
      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
        <Sparkles className="h-6 w-6" />
      </div>
      <h1 className="text-lg font-bold text-gray-900">{t("chat.title")}</h1>
      <p className="text-sm text-gray-500">{t("chat.subtitle")}</p>
      {!isAuthenticated && (
        <p className="mt-1 text-xs text-amber-600">{t("chat.loginForPersonalized")}</p>
      )}
    </div>
  );
}

function ErrorBanner({ error, onDismiss }: { error: string; onDismiss: () => void }) {
  return (
    <div className="mx-4 mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <p>{error}</p>
      <button onClick={onDismiss} className="ml-auto text-red-500 hover:text-red-700">×</button>
    </div>
  );
}

// Featured products display (for bestsellers, recommendations, etc)
function FeaturedProductsGrid({ 
  products, 
  locale, 
  onProductClick 
}: { 
  products: FeaturedProduct[]; 
  locale: string;
  onProductClick: (product: FeaturedProduct) => void;
}) {
  // Get backend URL for images
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';
  
  const getImageUrl = (imageUrl: string | undefined | null): string | null => {
    if (!imageUrl) return null;
    // If already a full URL, return as-is
    if (imageUrl.startsWith('http')) return imageUrl;
    // Otherwise prepend backend URL
    return `${backendUrl}${imageUrl}`;
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => {
          const imageUrl = getImageUrl(product.image_url) || getImageUrl(product.thumbnail_url);
          
          return (
            <button
              key={product.id}
              onClick={() => onProductClick(product)}
              className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-green-300 transition-all text-left"
            >
              {/* Bestseller badge */}
              {product.is_bestseller && (
                <div className="absolute top-2 right-2 z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    🔥 {locale === "en" ? "TOP" : "LARIS"}
                  </span>
                </div>
              )}
              
              {/* Product image */}
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 mb-3">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-4xl">🧃</span>
                  </div>
                )}
              </div>
              
              {/* Product info */}
              <div className="space-y-1">
                <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-green-600 transition-colors">
                  {product.name}
                </h4>
                {product.category && (
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                    {product.category}
                  </p>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-green-600 text-sm">
                    Rp {product.price.toLocaleString("id-ID")}
                  </span>
                  {product.calories && (
                    <span className="text-[10px] text-gray-400">
                      {product.calories} kcal
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Tip */}
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
        <Sparkles className="h-4 w-4 shrink-0" />
        <span>
          {locale === "en" 
            ? "Click a product or type: 'Buy [name] 1' to order!" 
            : "Klik produk atau ketik: 'Beli [nama] 1' untuk pesan!"}
        </span>
      </div>
    </div>
  );
}

// Product card for small orders (less than 3 items)
function OrderProductCards({ orderData, locale, onCheckout }: { 
  orderData: ChatOrderData; 
  locale: string;
  onCheckout: () => void;
}) {
  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-3">
        {orderData.items.map((item, index) => (
          <div 
            key={index} 
            className="flex items-center gap-3 rounded-xl bg-white border border-gray-200 p-3 shadow-sm"
          >
            <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-gray-100 shrink-0">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.product_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  <ShoppingCart className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{item.product_name}</h4>
              <p className="text-xs text-gray-500">
                {item.quantity}x • {item.size} • Rp {item.unit_price.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-green-600">
                Rp {item.total_price.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Total and Checkout */}
      <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-4 border border-green-200">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Subtotal</span>
          <span>Rp {orderData.subtotal.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{locale === "en" ? "Tax (10%)" : "Pajak (10%)"}</span>
          <span>Rp {orderData.tax.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex justify-between font-bold text-lg text-gray-900 pt-2 border-t border-green-200">
          <span>Total</span>
          <span className="text-green-600">Rp {orderData.total.toLocaleString("id-ID")}</span>
        </div>
        <Button 
          onClick={onCheckout}
          className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <ShoppingCart className="h-5 w-5" />
          {locale === "en" ? "Proceed to Checkout" : "Lanjut ke Checkout"}
        </Button>
      </div>
    </div>
  );
}

// Bill format for larger orders (3+ items)
function OrderBill({ orderData, locale, onCheckout }: { 
  orderData: ChatOrderData; 
  locale: string;
  onCheckout: () => void;
}) {
  return (
    <div className="mt-3">
      <div className="rounded-xl bg-white border-2 border-dashed border-gray-300 p-4 font-mono text-sm">
        {/* Header */}
        <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
          <h3 className="font-bold text-lg">🧃 JuiceQu</h3>
          <p className="text-xs text-gray-500">{locale === "en" ? "Order Summary" : "Ringkasan Pesanan"}</p>
        </div>
        
        {/* Items */}
        <div className="space-y-2 mb-3">
          {orderData.items.map((item, index) => (
            <div key={index} className="flex justify-between">
              <div className="flex-1">
                <span className="font-medium">{item.quantity}x</span>{" "}
                <span>{item.product_name}</span>
                <span className="text-gray-500 text-xs ml-1">({item.size})</span>
              </div>
              <span>Rp {item.total_price.toLocaleString("id-ID")}</span>
            </div>
          ))}
        </div>
        
        {/* Totals */}
        <div className="border-t border-dashed border-gray-300 pt-3 space-y-1">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>Rp {orderData.subtotal.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{locale === "en" ? "Tax (10%)" : "Pajak (10%)"}</span>
            <span>Rp {orderData.tax.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-dashed border-gray-300">
            <span>TOTAL</span>
            <span>Rp {orderData.total.toLocaleString("id-ID")}</span>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-3 pt-3 border-t border-dashed border-gray-300">
          <p className="text-xs text-gray-500">
            {locale === "en" ? "Thank you for ordering!" : "Terima kasih telah memesan!"}
          </p>
        </div>
      </div>
      
      {/* Checkout Button */}
      <Button 
        onClick={onCheckout}
        className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
      >
        <ShoppingCart className="h-5 w-5" />
        {locale === "en" ? "Proceed to Checkout" : "Lanjut ke Checkout"}
      </Button>
    </div>
  );
}

function MessageBubble({ 
  message, 
  locale, 
  onCheckout,
  onProductClick
}: { 
  message: Message; 
  locale: string; 
  onCheckout: (orderData: ChatOrderData) => void;
  onProductClick: (product: FeaturedProduct) => void;
}) {
  const isUser = message.role === "user";
  
  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        isUser ? "bg-gray-900 text-white" : "bg-green-600 text-white"
      }`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`max-w-[85%] ${isUser ? "" : ""}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? "bg-gray-900 text-white rounded-tr-none"
            : message.isError
            ? "bg-red-50 text-red-800 rounded-tl-none"
            : "bg-gray-100 text-gray-800 rounded-tl-none"
        }`}>
          {message.isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{locale === "en" ? "Thinking..." : "Berpikir..."}</span>
            </div>
          ) : (
            message.content
          )}
        </div>
        
        {/* Featured Products Display */}
        {message.featuredProducts && message.featuredProducts.length > 0 && (
          <FeaturedProductsGrid 
            products={message.featuredProducts}
            locale={locale}
            onProductClick={onProductClick}
          />
        )}
        
        {/* Order Data Display */}
        {message.orderData && message.showCheckout && message.orderData.items.length > 0 && (
          message.orderData.items.length < 3 ? (
            <OrderProductCards 
              orderData={message.orderData} 
              locale={locale} 
              onCheckout={() => onCheckout(message.orderData!)}
            />
          ) : (
            <OrderBill 
              orderData={message.orderData} 
              locale={locale} 
              onCheckout={() => onCheckout(message.orderData!)}
            />
          )
        )}
      </div>
    </div>
  );
}

function ChatInput({
  input,
  setInput,
  isLoading,
  isRecording,
  onSend,
  onStartRecording,
  onStopRecording,
  suggestions,
  t,
}: {
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  isRecording: boolean;
  onSend: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  suggestions: string[];
  t: (key: string) => string;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t border-gray-100 bg-white p-4">
      <div className="relative flex items-center gap-2">
        <Button
          onClick={isRecording ? onStopRecording : onStartRecording}
          size="icon"
          variant={isRecording ? "destructive" : "outline"}
          className={`h-10 w-10 rounded-full ${isRecording ? "animate-pulse" : ""}`}
          disabled={isLoading && !isRecording}
        >
          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? t("chat.recording") : t("chat.placeholder")}
          className="pr-12"
          disabled={isLoading || isRecording}
        />
        <Button
          onClick={onSend}
          size="icon"
          className="absolute right-1 top-1 h-10 w-10 rounded-full bg-green-600 hover:bg-green-700"
          disabled={isLoading || isRecording || !input.trim()}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setInput(suggestion)}
            className="whitespace-nowrap rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50"
            disabled={isLoading || isRecording}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { t, locale } = useTranslation();
  const { messages, input, setInput, isLoading, error, setError, sendMessage, processVoice } = useChat(locale);
  const { isRecording, recordingError, startRecording, stopRecording } = useVoiceRecorder(processVoice, locale);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addItem, clearCart } = useCartStore();
  
  const suggestions = locale === "en" ? SUGGESTIONS_EN : SUGGESTIONS_ID;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const displayError = error || recordingError;

  // Handle checkout - add items to cart and redirect
  const handleCheckout = useCallback((orderData: ChatOrderData) => {
    // Clear existing cart and add new items
    clearCart();
    
    for (const item of orderData.items) {
      addItem({
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        size: item.size as "small" | "medium" | "large",
        image_url: item.image_url || undefined,
      });
    }
    
    // Redirect to checkout
    router.push("/checkout");
  }, [addItem, clearCart, router]);

  // Handle product click - set input to order that product
  const handleProductClick = useCallback((product: FeaturedProduct) => {
    const orderMessage = locale === "en" 
      ? `Buy ${product.name} 1`
      : `Beli ${product.name} 1`;
    setInput(orderMessage);
  }, [locale, setInput]);

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="container mx-auto flex flex-1 flex-col px-4 py-4 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden rounded-3xl bg-white shadow-xl shadow-gray-200/50">
            <ChatHeader isAuthenticated={isAuthenticated} t={t} />
            {displayError && <ErrorBanner error={displayError} onDismiss={() => setError(null)} />}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg} 
                  locale={locale} 
                  onCheckout={handleCheckout}
                  onProductClick={handleProductClick}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
            <ChatInput
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              isRecording={isRecording}
              onSend={sendMessage}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              suggestions={suggestions}
              t={t}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
