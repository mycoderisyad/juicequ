"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, User, Bot, Mic, MicOff, Loader2, AlertCircle } from "lucide-react";
import aiApi, { ChatResponse } from "@/lib/api/ai";
import { useAuthStore } from "@/store/auth-store";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
  isError?: boolean;
  responseTimeMs?: number;
}

const INITIAL_MESSAGE: Message = {
  id: 1,
  role: "assistant",
  content: "Hi there! I'm your JuiceQu AI assistant. I can help you find the perfect smoothie based on your mood, health goals, or favorite ingredients. What are you in the mood for today?",
};

const SUGGESTIONS = [
  "I want something refreshing",
  "High protein options",
  "Low sugar juices",
  "What's your bestseller?",
  "Recommend something healthy",
];

function useChat() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const updateMessage = (id: number, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  };

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
      const response: ChatResponse = await aiApi.sendChatMessage({
        message: input,
        session_id: sessionId,
      });
      setSessionId(response.session_id);
      updateMessage(loadingMessageId, {
        content: response.response,
        isLoading: false,
        responseTimeMs: response.response_time_ms,
      });
    } catch (err) {
      updateMessage(loadingMessageId, {
        content: "Sorry, I couldn't process your request. Please try again.",
        isLoading: false,
        isError: true,
      });
      setError(err instanceof Error ? err.message : "Failed to get response");
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages.length, sessionId]);

  const processVoice = useCallback(async (audioBlob: Blob) => {
    const userMessageId = messages.length + 1;
    const loadingMessageId = messages.length + 2;

    addMessage({ id: userMessageId, role: "user", content: "🎤 Voice message...", isLoading: true });
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
        content: "Sorry, I couldn't process your voice message. Please try again.",
        isLoading: false,
        isError: true,
      });
      setError(err instanceof Error ? err.message : "Failed to process voice");
    } finally {
      setIsLoading(false);
    }
  }, [messages.length, sessionId]);

  return { messages, input, setInput, isLoading, error, setError, sendMessage, processVoice };
}

function useVoiceRecorder(onRecordingComplete: (blob: Blob) => void) {
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
      setRecordingError("Could not access microphone. Please check permissions.");
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return { isRecording, recordingError, startRecording, stopRecording };
}

function ChatHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="border-b border-gray-100 bg-white p-4 text-center">
      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
        <Sparkles className="h-6 w-6" />
      </div>
      <h1 className="text-lg font-bold text-gray-900">JuiceQu AI Assistant</h1>
      <p className="text-sm text-gray-500">Ask me anything about our menu!</p>
      {!isAuthenticated && (
        <p className="mt-1 text-xs text-amber-600">Log in for personalized recommendations</p>
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

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  
  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        isUser ? "bg-gray-900 text-white" : "bg-green-600 text-white"
      }`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
        isUser
          ? "bg-gray-900 text-white rounded-tr-none"
          : message.isError
          ? "bg-red-50 text-red-800 rounded-tl-none"
          : "bg-gray-100 text-gray-800 rounded-tl-none"
      }`}>
        {message.isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        ) : (
          message.content
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
}: {
  input: string;
  setInput: (v: string) => void;
  isLoading: boolean;
  isRecording: boolean;
  onSend: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
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
          placeholder={isRecording ? "Recording..." : "Type your message..."}
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
        {SUGGESTIONS.map((suggestion) => (
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
  const { isAuthenticated } = useAuthStore();
  const { messages, input, setInput, isLoading, error, setError, sendMessage, processVoice } = useChat();
  const { isRecording, recordingError, startRecording, stopRecording } = useVoiceRecorder(processVoice);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const displayError = error || recordingError;

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="container mx-auto flex flex-1 flex-col px-4 py-4 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden rounded-3xl bg-white shadow-xl shadow-gray-200/50">
            <ChatHeader isAuthenticated={isAuthenticated} />
            {displayError && <ErrorBanner error={displayError} onDismiss={() => setError(null)} />}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)}
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
            />
          </div>
        </div>
      </main>
    </div>
  );
}
