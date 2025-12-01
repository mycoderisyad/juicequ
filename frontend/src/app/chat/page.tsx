"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles, User, Bot } from "lucide-react";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hi there! I'm your JuiceQu AI assistant. I can help you find the perfect smoothie based on your mood, health goals, or favorite ingredients. What are you in the mood for today?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage = {
      id: messages.length + 1,
      role: "user",
      content: input,
    };
    
    setMessages([...messages, userMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: messages.length + 2,
        role: "assistant",
        content: "That sounds delicious! Based on what you said, I'd recommend our 'Berry Blast' or 'Tropical Paradise'. Would you like to see the details?",
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      
      <main className="flex flex-1 flex-col">
        <div className="container mx-auto flex flex-1 flex-col px-4 py-6">
          {/* Chat Container */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-3xl bg-white shadow-xl shadow-gray-200/50">
            {/* Chat Header */}
            <div className="border-b border-gray-100 bg-white p-4 text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Sparkles className="h-6 w-6" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">JuiceQu AI Assistant</h1>
              <p className="text-sm text-gray-500">Ask me anything about our menu!</p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    msg.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      msg.role === "user"
                        ? "bg-gray-900 text-white"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "bg-gray-900 text-white rounded-tr-none"
                        : "bg-gray-100 text-gray-800 rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-100 bg-white p-4">
              <div className="relative flex items-center gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your message..."
                  className="pr-12"
                />
                <Button
                  onClick={handleSend}
                  size="icon"
                  className="absolute right-1 top-1 h-10 w-10 rounded-full bg-green-600 hover:bg-green-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {["I want something refreshing", "High protein options", "Low sugar juices"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="whitespace-nowrap rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
