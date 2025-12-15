"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  Send, 
  Sparkles, 
  User, 
  Bot, 
  Mic, 
  MicOff, 
  Loader2, 
  AlertCircle, 
  ShoppingCart,
  Plus,
  MessageSquare,
  Menu,
  X,
  Trash2,
  ChevronLeft,
  Home
} from "lucide-react";
import aiApi, { ChatResponse, ChatOrderData, ChatMessageHistory, FeaturedProduct } from "@/lib/api/ai";
import { useTranslation } from "@/lib/i18n";
import { useCartStore } from "@/lib/store";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import Link from "next/link";

const MAX_MESSAGES_PER_SESSION = 20;
const STORAGE_KEY = "juicequ_chat_sessions";

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

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  sessionId?: string;
  createdAt: string;
  messageCount: number;
}

const SUGGESTIONS_EN = [
  "What's your bestseller?",
  "Healthy options",
  "Buy Berry Blast",
  "Recommend something",
];

const SUGGESTIONS_ID = [
  "Apa yang paling laris?",
  "Pilihan sehat",
  "Beli Berry Blast",
  "Rekomendasikan",
];

function generateSessionId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getInitialMessage(locale: string): Message {
  return {
    id: 1,
    role: "assistant",
    content: locale === "en"
      ? "Hi! I'm JuiceQu AI. I can help you find smoothies or place orders. Try: 'Buy 2 Acai Mango'"
      : "Halo! Saya AI JuiceQu. Saya bisa bantu cari smoothie atau pesan. Coba: 'Beli Acai Mango 2'",
  };
}

function createNewSession(locale: string): ChatSession {
  return {
    id: generateSessionId(),
    title: locale === "en" ? "New Chat" : "Chat Baru",
    messages: [getInitialMessage(locale)],
    createdAt: new Date().toISOString(),
    messageCount: 0,
  };
}

// Load sessions from localStorage
function loadSessions(locale: string): ChatSession[] {
  if (typeof window === "undefined") return [createNewSession(locale)];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return [createNewSession(locale)];
}

// Save sessions to localStorage
function saveSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  try {
    // Only save essential data, remove loading states
    const toSave = sessions.map(s => ({
      ...s,
      messages: s.messages.filter(m => !m.isLoading).map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        isError: m.isError,
      })),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // Ignore storage errors
  }
}

// Featured products display
function FeaturedProductsGrid({
  products,
  locale,
  onProductClick
}: {
  products: FeaturedProduct[];
  locale: string;
  onProductClick: (product: FeaturedProduct) => void;
}) {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

  const getImageUrl = (imageUrl: string | undefined | null): string | null => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${backendUrl}${imageUrl}`;
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {products.map((product) => {
          const imageUrl = getImageUrl(product.image_url) || getImageUrl(product.thumbnail_url);
          return (
            <button
              key={product.id}
              onClick={() => onProductClick(product)}
              className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-white border border-stone-200 p-2 sm:p-3 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all text-left"
            >
              {product.is_bestseller && (
                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-1.5 sm:px-2 py-0.5 text-[8px] sm:text-[10px] font-bold text-white shadow-sm">
                    {locale === "en" ? "TOP" : "LARIS"}
                  </span>
                </div>
              )}
              <div className="relative aspect-square w-full overflow-hidden rounded-lg sm:rounded-xl bg-stone-50 mb-2 sm:mb-3">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-emerald-50">
                    <span className="text-2xl sm:text-4xl">🧃</span>
                  </div>
                )}
              </div>
              <div className="space-y-0.5 sm:space-y-1">
                <h4 className="font-medium text-emerald-950 text-xs sm:text-sm leading-tight line-clamp-2 group-hover:text-emerald-600 transition-colors">
                  {product.name}
                </h4>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-600 text-xs sm:text-sm">
                    Rp {(product.price / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Order product cards
function OrderProductCards({ orderData, locale, onCheckout }: {
  orderData: ChatOrderData;
  locale: string;
  onCheckout: () => void;
}) {
  return (
    <div className="mt-3 space-y-3">
      <div className="grid gap-2 sm:gap-3">
        {orderData.items.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl bg-white border border-stone-200 p-2 sm:p-3 shadow-sm"
          >
            <div className="relative h-12 w-12 sm:h-16 sm:w-16 overflow-hidden rounded-lg sm:rounded-xl bg-stone-100 shrink-0">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.product_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-stone-400 bg-emerald-50">
                  <ShoppingCart className="h-4 w-4 sm:h-6 sm:w-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-emerald-950 truncate text-sm">{item.product_name}</h4>
              <p className="text-xs text-stone-500">
                {item.quantity}x - Rp {(item.unit_price / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-emerald-600 text-sm">
                Rp {(item.total_price / 1000).toFixed(0)}k
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl sm:rounded-2xl bg-stone-50 p-3 sm:p-4 border border-stone-200">
        <div className="flex justify-between font-bold text-base sm:text-lg text-emerald-950">
          <span>Total</span>
          <span className="text-emerald-600">Rp {orderData.total.toLocaleString("id-ID")}</span>
        </div>
        <Button
          onClick={onCheckout}
          className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 sm:py-3 rounded-full flex items-center justify-center gap-2 text-sm"
        >
          <ShoppingCart className="h-4 w-4" />
          {locale === "en" ? "Checkout" : "Checkout"}
        </Button>
      </div>
    </div>
  );
}

// Order bill
function OrderBill({ orderData, locale, onCheckout }: {
  orderData: ChatOrderData;
  locale: string;
  onCheckout: () => void;
}) {
  return (
    <div className="mt-3">
      <div className="rounded-xl sm:rounded-2xl bg-white border-2 border-dashed border-stone-300 p-3 sm:p-4 font-mono text-xs sm:text-sm">
        <div className="text-center border-b border-dashed border-stone-300 pb-2 sm:pb-3 mb-2 sm:mb-3">
          <h3 className="font-bold text-base sm:text-lg text-emerald-950">JuiceQu</h3>
        </div>
        <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
          {orderData.items.map((item, index) => (
            <div key={index} className="flex justify-between text-stone-700">
              <span>{item.quantity}x {item.product_name}</span>
              <span>Rp {(item.total_price / 1000).toFixed(0)}k</span>
            </div>
          ))}
        </div>
        <div className="border-t border-dashed border-stone-300 pt-2 sm:pt-3">
          <div className="flex justify-between font-bold text-emerald-950">
            <span>TOTAL</span>
            <span className="text-emerald-600">Rp {orderData.total.toLocaleString("id-ID")}</span>
          </div>
        </div>
      </div>
      <Button
        onClick={onCheckout}
        className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 sm:py-3 rounded-full flex items-center justify-center gap-2 text-sm"
      >
        <ShoppingCart className="h-4 w-4" />
        Checkout
      </Button>
    </div>
  );
}

// Message bubble
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
    <div className={`py-3 sm:py-4 ${isUser ? "bg-transparent" : "bg-stone-50/50"}`}>
      <div className="max-w-3xl mx-auto px-3 sm:px-4">
        <div className={`flex gap-2 sm:gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
          <div className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full ${
            isUser ? "bg-emerald-600" : "bg-emerald-100"
          }`}>
            {isUser ? (
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
            ) : (
              <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
            )}
          </div>
          <div className={`flex-1 min-w-0 ${isUser ? "text-right" : ""}`}>
            <div className={`inline-block max-w-full text-left ${
              isUser 
                ? "bg-emerald-600 text-white rounded-2xl rounded-tr-sm px-3 sm:px-4 py-2 sm:py-3" 
                : ""
            }`}>
              {message.isLoading ? (
                <div className="flex items-center gap-2 text-stone-500">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              ) : isUser ? (
                <span className="text-xs sm:text-sm">{message.content}</span>
              ) : (
                <div
                  className={`text-xs sm:text-sm text-stone-700 leading-relaxed ${message.isError ? "text-red-600" : ""}`}
                  dangerouslySetInnerHTML={{
                    __html: message.content
                      .replace(/\n/g, '<br/>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  }}
                />
              )}
            </div>

            {message.featuredProducts && message.featuredProducts.length > 0 && (
              <FeaturedProductsGrid
                products={message.featuredProducts}
                locale={locale}
                onProductClick={onProductClick}
              />
            )}

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
      </div>
    </div>
  );
}

// Sidebar
function ChatSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isOpen,
  onToggle,
  locale,
}: {
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  locale: string;
}) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        bg-stone-50 border-r border-stone-200 flex-col
        transform transition-all duration-300 ease-in-out
        hidden lg:flex
        ${isOpen ? "w-64 sm:w-72 translate-x-0 !flex" : "w-0 -translate-x-full lg:w-14 lg:translate-x-0"}
      `}>
        {/* Header with close button */}
        {isOpen && (
          <div className="p-2 sm:p-3 flex items-center justify-between border-b border-stone-200">
            <span className="text-sm font-medium text-stone-600 pl-2">
              {locale === "en" ? "Chat History" : "Riwayat Chat"}
            </span>
            <button
              onClick={onToggle}
              className="p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              aria-label={locale === "en" ? "Close sidebar" : "Tutup sidebar"}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* New Chat Button */}
        <div className={`p-2 sm:p-3 ${isOpen ? "" : "flex justify-center"}`}>
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onToggle();
            }}
            className={`flex items-center gap-2 sm:gap-3 rounded-xl border border-stone-200 text-stone-600 hover:bg-white hover:text-emerald-600 hover:border-emerald-200 transition-colors ${
              isOpen ? "w-full px-3 sm:px-4 py-2.5 sm:py-3" : "p-2.5 sm:p-3"
            }`}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {isOpen && (
              <span className="text-sm font-medium">
                {locale === "en" ? "New Chat" : "Chat Baru"}
              </span>
            )}
          </button>
        </div>

        {/* Chat History */}
        {isOpen && (
          <div className="flex-1 overflow-y-auto px-2">
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group relative flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2.5 sm:py-3 rounded-xl cursor-pointer transition-colors ${
                    session.id === currentSessionId
                      ? "bg-white text-emerald-700 shadow-sm border border-emerald-100"
                      : "text-stone-600 hover:bg-white hover:shadow-sm"
                  }`}
                  onClick={() => {
                    onSelectSession(session.id);
                    if (window.innerWidth < 1024) onToggle();
                  }}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    <p className="text-xs text-stone-400">
                      {session.messageCount}/{MAX_MESSAGES_PER_SESSION}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapsed state */}
        {!isOpen && (
          <div className="flex-1 overflow-y-auto px-1.5 hidden lg:block">
            <div className="space-y-1">
              {sessions.slice(0, 5).map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`w-full p-2.5 rounded-lg transition-colors ${
                    session.id === currentSessionId
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-stone-500 hover:bg-white hover:text-stone-700"
                  }`}
                  title={session.title}
                >
                  <MessageSquare className="h-4 w-4 mx-auto" />
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// Chat input
function ChatInput({
  input,
  setInput,
  isLoading,
  isRecording,
  isSpeechSupported,
  onSend,
  onStartRecording,
  onStopRecording,
  suggestions,
  locale,
  disabled,
  disabledReason,
  onNewChat,
}: {
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  isRecording: boolean;
  isSpeechSupported: boolean;
  onSend: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  suggestions: string[];
  locale: string;
  disabled: boolean;
  disabledReason?: string;
  onNewChat: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="bg-white p-3 sm:p-4 safe-area-bottom">
      <div className="max-w-3xl mx-auto">
        {disabled && disabledReason && (
          <div className="mb-3 flex flex-col sm:flex-row items-center justify-center gap-2 rounded-xl bg-amber-50 p-3 text-xs sm:text-sm text-amber-700 border border-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{disabledReason}</span>
            </div>
            <button
              onClick={onNewChat}
              className="text-emerald-600 font-medium hover:underline"
            >
              {locale === "en" ? "Start New Chat" : "Mulai Chat Baru"}
            </button>
          </div>
        )}
        
        <div className="relative flex items-center gap-1.5 sm:gap-2 bg-stone-100 rounded-2xl p-1.5 sm:p-2">
          <Button
            onClick={isRecording ? onStopRecording : onStartRecording}
            size="icon"
            variant="ghost"
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full shrink-0 ${
              isRecording 
                ? "bg-red-500 text-white hover:bg-red-600" 
                : "text-stone-500 hover:bg-stone-200 hover:text-stone-700"
            }`}
            disabled={(isLoading && !isRecording) || !isSpeechSupported || disabled}
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled 
                ? (locale === "en" ? "Start new chat" : "Mulai chat baru")
                : isRecording 
                  ? (locale === "en" ? "Listening..." : "Mendengarkan...")
                  : (locale === "en" ? "Ask anything..." : "Tanya apa saja...")
            }
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-stone-700 placeholder:text-stone-400 px-1 sm:px-2"
            disabled={isLoading || disabled}
            readOnly={isRecording}
          />
          
          <Button
            onClick={onSend}
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 shrink-0"
            disabled={isLoading || isRecording || !input.trim() || disabled}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        {isRecording && (
          <div className="mt-2 flex items-center justify-center gap-2 text-xs sm:text-sm text-red-600">
            <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-full w-full bg-red-500" />
            </span>
            <span>{locale === "en" ? "Listening..." : "Mendengarkan..."}</span>
          </div>
        )}

        {!disabled && (
          <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2 justify-center">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="rounded-full border border-stone-200 bg-white px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-medium text-stone-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 disabled:opacity-50 transition-colors"
                disabled={isLoading || isRecording}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Welcome screen
function WelcomeScreen({ locale }: { locale: string }) {
  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
      <div className="text-center max-w-sm sm:max-w-md">
        <div className="mx-auto mb-4 sm:mb-6 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-emerald-100">
          <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
        </div>
        <h1 className="text-xl sm:text-2xl font-serif font-medium text-emerald-950 mb-2 sm:mb-3">
          {locale === "en" ? "JuiceQu AI" : "AI JuiceQu"}
        </h1>
        <p className="text-stone-500 text-xs sm:text-sm leading-relaxed">
          {locale === "en"
            ? "Find smoothies, get recommendations, or place orders directly!"
            : "Cari smoothie, dapatkan rekomendasi, atau pesan langsung!"
          }
        </p>
      </div>
    </div>
  );
}

// Chat header - shows on all screen sizes
function ChatHeader({ 
  onMenuClick, 
  locale,
  sidebarOpen,
}: { 
  onMenuClick: () => void;
  locale: string;
  sidebarOpen: boolean;
}) {
  return (
    <header className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 border-b border-stone-200 bg-white">
      {/* Menu button - only show on mobile OR when sidebar is closed on desktop */}
      <button
        onClick={onMenuClick}
        className={`p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors ${sidebarOpen ? 'lg:invisible' : ''}`}
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-emerald-600" />
        <span className="font-medium text-emerald-950 text-sm">JuiceQu AI</span>
      </div>
      <Link
        href="/"
        className="p-2 text-stone-500 hover:text-emerald-600 hover:bg-stone-100 rounded-lg transition-colors"
        title={locale === "en" ? "Back to Home" : "Kembali ke Beranda"}
      >
        <Home className="h-5 w-5" />
      </Link>
    </header>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const { locale } = useTranslation();
  const { addItem, clearCart } = useCartStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Session management - initialize from localStorage
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Chat state
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    const loaded = loadSessions(locale);
    setSessions(loaded);
    setCurrentSessionId(loaded[0]?.id || "");
    // Open sidebar by default on desktop
    setSidebarOpen(window.innerWidth >= 1024);
  }, [locale]);

  // Save to localStorage when sessions change
  useEffect(() => {
    if (isClient && sessions.length > 0) {
      saveSessions(sessions);
    }
  }, [sessions, isClient]);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];
  const messageCount = currentSession?.messageCount || 0;
  const isSessionFull = messageCount >= MAX_MESSAGES_PER_SESSION;

  // Speech recognition
  const handleVoiceResult = useCallback((transcript: string) => {
    if (transcript.trim()) {
      setInput(transcript);
    }
  }, []);

  const handleVoiceError = useCallback((errorMsg: string) => {
    setError(errorMsg);
  }, []);

  const {
    isSupported: isSpeechSupported,
    isListening,
    transcript: interimTranscript,
    error: speechError,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    language: locale === "en" ? "en-US" : "id-ID",
    interimResults: true,
    onResult: handleVoiceResult,
    onError: handleVoiceError,
  });

  const suggestions = locale === "en" ? SUGGESTIONS_EN : SUGGESTIONS_ID;

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update session
  const updateSession = useCallback((sessionId: string, updates: Partial<ChatSession>) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, ...updates } : s
    ));
  }, []);

  // Get conversation history
  const getConversationHistory = useCallback((): ChatMessageHistory[] => {
    return messages
      .filter(m => !m.isLoading && m.content)
      .map(m => ({
        role: m.role,
        content: m.content,
      }));
  }, [messages]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || isSessionFull || !currentSession) return;

    const userMessage: Message = { 
      id: messages.length + 1, 
      role: "user", 
      content: input 
    };
    const loadingMessageId = messages.length + 2;

    const newMessages = [
      ...messages, 
      userMessage, 
      { id: loadingMessageId, role: "assistant" as const, content: "", isLoading: true }
    ];
    
    const newTitle = currentSession.messageCount === 0 
      ? input.slice(0, 25) + (input.length > 25 ? "..." : "")
      : currentSession.title;

    updateSession(currentSessionId, { 
      messages: newMessages,
      title: newTitle,
      messageCount: currentSession.messageCount + 1,
    });
    
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const conversationHistory = getConversationHistory();
      const response: ChatResponse = await aiApi.sendChatMessage({
        message: input,
        session_id: currentSession.sessionId,
        locale: locale,
        conversation_history: conversationHistory,
      });

      const updatedMessages = newMessages.map(msg => 
        msg.id === loadingMessageId 
          ? {
              ...msg,
              content: response.response,
              isLoading: false,
              responseTimeMs: response.response_time_ms,
              orderData: response.order_data,
              showCheckout: response.show_checkout,
              featuredProducts: response.featured_products,
            }
          : msg
      );

      updateSession(currentSessionId, { 
        messages: updatedMessages,
        sessionId: response.session_id,
      });
    } catch (err) {
      const errorMessage = locale === "en"
        ? "Sorry, something went wrong. Please try again."
        : "Maaf, terjadi kesalahan. Silakan coba lagi.";

      const updatedMessages = newMessages.map(msg => 
        msg.id === loadingMessageId 
          ? { ...msg, content: errorMessage, isLoading: false, isError: true }
          : msg
      );

      updateSession(currentSessionId, { messages: updatedMessages });
      setError(err instanceof Error ? err.message : errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isSessionFull, currentSession, messages, currentSessionId, locale, getConversationHistory, updateSession]);

  // New chat
  const handleNewChat = useCallback(() => {
    const newSession = createNewSession(locale);
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setInput("");
    setError(null);
  }, [locale]);

  // Select session
  const handleSelectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    setInput("");
    setError(null);
  }, []);

  // Delete session
  const handleDeleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (filtered.length === 0) {
        const newSession = createNewSession(locale);
        setCurrentSessionId(newSession.id);
        return [newSession];
      }
      if (sessionId === currentSessionId) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  }, [currentSessionId, locale]);

  // Handle checkout
  const handleCheckout = useCallback((orderData: ChatOrderData) => {
    clearCart();
    for (const item of orderData.items) {
      addItem({
        id: item.product_id,
        productId: item.product_id,
        name: item.product_name,
        price: item.unit_price,
        quantity: item.quantity,
        image: item.image_url || undefined,
      });
    }
    router.push("/checkout");
  }, [addItem, clearCart, router]);

  // Handle product click
  const handleProductClick = useCallback((product: FeaturedProduct) => {
    const orderMessage = locale === "en"
      ? `Buy ${product.name} 1`
      : `Beli ${product.name} 1`;
    setInput(orderMessage);
  }, [locale]);

  const displayError = error || speechError;

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] bg-white">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        locale={locale}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* Header */}
        <ChatHeader 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          locale={locale}
          sidebarOpen={sidebarOpen}
        />

        {/* Error Banner */}
        {displayError && (
          <div className="mx-3 sm:mx-4 mt-3 sm:mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-2.5 sm:p-3 text-xs sm:text-sm text-red-700 border border-red-100">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="flex-1 line-clamp-2">{displayError}</p>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length <= 1 ? (
            <WelcomeScreen locale={locale} />
          ) : (
            <div className="pb-2 sm:pb-4">
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
          )}
        </div>

        {/* Input */}
        <ChatInput
          input={isListening ? interimTranscript || input : input}
          setInput={setInput}
          isLoading={isLoading}
          isRecording={isListening}
          isSpeechSupported={isSpeechSupported}
          onSend={sendMessage}
          onStartRecording={startListening}
          onStopRecording={stopListening}
          suggestions={suggestions}
          locale={locale}
          disabled={isSessionFull}
          disabledReason={isSessionFull 
            ? (locale === "en" 
                ? "Message limit reached." 
                : "Batas pesan tercapai.")
            : undefined
          }
          onNewChat={handleNewChat}
        />
      </div>
    </div>
  );
}
