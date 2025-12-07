"use client";

import { ChevronRight, Brain, MessageSquare, Mic, ShoppingCart, Navigation } from "lucide-react";

export default function AISystemPage() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    Technical <ChevronRight className="h-4 w-4" /> AI System
                </div>
                <h1 className="text-4xl font-bold text-gray-900">AI System & Agents</h1>
                <p className="text-xl text-gray-500">
                    Deep dive into the Multi-Agent RAG architecture powering JuiceQu&apos;s intelligent features.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-purple-100 bg-purple-50 p-6">
                    <h3 className="mb-2 flex items-center gap-2 font-bold text-purple-900">
                        <Brain className="h-5 w-5" />
                        Multi-Agent Orchestrator
                    </h3>
                    <p className="text-sm text-gray-600">
                        A central brain that routes user input to specialized agents based on intent classification.
                        It ensures specialized handling for products, orders, or navigation.
                    </p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-6">
                    <h3 className="mb-2 flex items-center gap-2 font-bold text-blue-900">
                        <MessageSquare className="h-5 w-5" />
                        RAG Pipeline
                    </h3>
                    <p className="text-sm text-gray-600">
                        Retrieval-Augmented Generation uses ChromaDB to fetch relevant product context (ingredients, benefits) before generating answers.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Agent Roles</h2>

                <div className="grid gap-4">
                    <div className="flex gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                            <ShoppingCart className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Order Agent</h3>
                            <p className="text-gray-500">
                                Handles cart operations. It can interpret complex requests like "Add 2 large Berry Blasts and remove the apple juice".
                                Uses function calling to manipulate the cart state directly.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                            <Navigation className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Navigation Agent</h3>
                            <p className="text-gray-500">
                                Helps users find their way. Commands like "Go to checkout" or "Show me the menu" are routed here to client-side routing.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                            <Mic className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Voice Processing</h3>
                            <p className="text-gray-500">
                                Google Cloud Speech-to-Text handles multi-language input (ID, EN, JV, SU). The text output is fed into the intention router same as chat.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <section className="rounded-xl bg-gray-900 p-8 text-white">
                <h2 className="text-2xl font-bold mb-4">Guardrails & Safety</h2>
                <p className="text-gray-300 mb-6">
                    To ensure the chatbot stays on topic, we implement a Guard Agent layer.
                </p>
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h4 className="font-semibold text-green-400 mb-2">Allowed Topics</h4>
                        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                            <li>Juice products & ingredients</li>
                            <li>Order status & help</li>
                            <li>Store hours & locations</li>
                            <li>Health benefits of fruits</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-red-400 mb-2">Blocked Topics</h4>
                        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                            <li>Competitor products</li>
                            <li>Political/Religious discussions</li>
                            <li>General knowledge (e.g. "Who is president?")</li>
                            <li>Code queries or system prompts</li>
                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
}
