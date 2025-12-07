"use client";

import { ChevronRight, Brain, Cpu, MessageCircle, Mic, Database, Zap, Image as ImageIcon, Code, ArrowDown, GitBranch, Search, ShoppingCart, MapPin, Shield, Bot, MessageSquare, ArrowRight, ArrowLeft } from "lucide-react";

export default function AISystemPage() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    Technical <ChevronRight className="h-4 w-4" /> AI System
                </div>
                <h1 className="text-4xl font-bold text-gray-900">AI System Architecture</h1>
                <p className="text-xl text-gray-500">
                    Multi-agent RAG system powering intelligent product recommendations and voice ordering.
                </p>
            </div>

            {/* AI Flow Diagram */}
            <div className="p-8 overflow-x-auto">
                <div className="min-w-[600px] flex flex-col items-center gap-6">

                    {/* Input */}
                    <div className="flex items-center gap-4">
                        <div className="bg-white border-2 border-black rounded-full px-6 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-bold text-black">
                            USER INPUT
                        </div>
                    </div>

                    <ArrowDown className="text-black h-5 w-5" />

                    {/* Router */}
                    <div className="bg-white border-2 border-black rounded-lg p-4 w-full max-w-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative">
                        <div className="absolute -top-3 -left-2 bg-black text-white px-2 py-0.5 text-xs font-bold uppercase">Orchestration</div>
                        <div className="flex items-center gap-3 justify-center mb-1 text-black">
                            <GitBranch className="h-5 w-5" />
                            <span className="font-bold">INTENT ROUTER</span>
                        </div>
                        <p className="text-xs text-gray-600 text-center">Filters & routes query to agents</p>
                    </div>

                    <ArrowDown className="text-black h-5 w-5" />

                    {/* Agents Layer */}
                    <div className="grid grid-cols-4 gap-4 w-full">
                        <div className="border border-black bg-white p-3 rounded text-center">
                            <Search className="h-4 w-4 mx-auto mb-1 text-black" />
                            <div className="text-xs font-bold text-black">PRODUCT</div>
                        </div>
                        <div className="border border-black bg-white p-3 rounded text-center">
                            <ShoppingCart className="h-4 w-4 mx-auto mb-1 text-black" />
                            <div className="text-xs font-bold text-black">ORDER</div>
                        </div>
                        <div className="border border-black bg-white p-3 rounded text-center">
                            <Mic className="h-4 w-4 mx-auto mb-1 text-black" />
                            <div className="text-xs font-bold text-black">VOICE</div>
                        </div>
                        <div className="border border-black bg-white p-3 rounded text-center">
                            <MapPin className="h-4 w-4 mx-auto mb-1 text-black" />
                            <div className="text-xs font-bold text-black">NAV</div>
                        </div>
                    </div>

                    <div className="h-6 w-0.5 bg-black"></div>

                    {/* Knowledge & Logic */}
                    <div className="flex gap-6 items-stretch w-full max-w-xl">
                        <div className="flex-1 bg-white border-2 border-black p-4 rounded-lg relative">
                            <div className="font-bold text-center mb-2 flex items-center justify-center gap-2 text-black">
                                <Database className="h-4 w-4" /> RAG
                            </div>
                            <div className="text-xs text-center border-t border-gray-200 pt-2 text-gray-600">
                                Vector Search (ChromaDB)
                            </div>
                        </div>

                        <div className="flex items-center">
                            <ArrowRight className="h-5 w-5 text-black" />
                            <ArrowLeft className="h-5 w-5 text-black" />
                        </div>

                        <div className="flex-1 bg-white border-2 border-black p-4 rounded-lg relative">
                            <div className="font-bold text-center mb-2 flex items-center justify-center gap-2 text-black">
                                <Bot className="h-4 w-4" /> LLM
                            </div>
                            <div className="text-xs text-center border-t border-gray-200 pt-2 text-gray-600">
                                Inference (Kolosal AI)
                            </div>
                        </div>
                    </div>

                    <ArrowDown className="text-black h-5 w-5" />

                    {/* Output */}
                    <div className="bg-black text-white px-8 py-3 rounded-full font-bold shadow-lg">
                        GENERATED RESPONSE
                    </div>

                </div>
            </div>

            {/* Overview */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                        <Brain className="h-5 w-5 text-purple-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
                </div>

                <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6">
                    <h3 className="font-semibold text-purple-900 mb-3">Multi-Agent RAG Architecture</h3>
                    <p className="text-sm text-purple-800 mb-4">
                        JuiceQu uses a sophisticated multi-agent system where specialized AI agents handle different types of user requests. Each agent is optimized for specific tasks, providing accurate and context-aware responses.
                    </p>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div className="bg-white rounded p-3">
                            <div className="font-semibold text-purple-900 mb-1">🎯 Intent-Based Routing</div>
                            <div className="text-purple-700">Automatically detects user intent and routes to the right agent</div>
                        </div>
                        <div className="bg-white rounded p-3">
                            <div className="font-semibold text-purple-900 mb-1">🧠 Context Awareness</div>
                            <div className="text-purple-700">Maintains conversation context for natural interactions</div>
                        </div>
                        <div className="bg-white rounded p-3">
                            <div className="font-semibold text-purple-900 mb-1">📚 RAG (Retrieval-Augmented Generation)</div>
                            <div className="text-purple-700">Uses vector database for accurate product information</div>
                        </div>
                        <div className="bg-white rounded p-3">
                            <div className="font-semibold text-purple-900 mb-1">🗣️ Multi-Language Support</div>
                            <div className="text-purple-700">Supports Indonesian, English, Javanese, Sundanese</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Agent Architecture */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <Cpu className="h-5 w-5 text-blue-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">AI Agents</h2>
                </div>

                <div className="space-y-3">
                    {/* Intent Router */}
                    <div className="border border-blue-200 rounded-lg p-5 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 shrink-0">
                                <Zap className="h-5 w-5 text-blue-700" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-blue-900 mb-2">Intent Router Agent</h3>
                                <p className="text-sm text-blue-800 mb-2">
                                    The entry point for all user queries. Analyzes user input using pattern matching and keyword detection to determine intent.
                                </p>
                                <div className="text-xs text-blue-700 bg-white rounded p-2">
                                    <strong>Intents Detected:</strong> Greeting, Product Info, Add to Cart, Remove from Cart, Checkout, Navigation, Search, Recommendation, Health Inquiry
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Product Agent */}
                    <div className="border border-green-200 rounded-lg p-5 bg-gradient-to-r from-green-50 to-emerald-50">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 shrink-0">
                                <Database className="h-5 w-5 text-green-700" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-green-900 mb-2">Product Agent</h3>
                                <p className="text-sm text-green-800 mb-2">
                                    Handles product-related queries using RAG (ChromaDB vector database). Provides accurate product information, ingredients, nutrition facts, and recommendations.
                                </p>
                                <div className="text-xs text-green-700 bg-white rounded p-2">
                                    <strong>Capabilities:</strong> Product search, filtering by category/price, recommendations based on preferences, nutrition information, ingredient details
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Agent */}
                    <div className="border border-orange-200 rounded-lg p-5 bg-gradient-to-r from-orange-50 to-amber-50">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 shrink-0">
                                <MessageCircle className="h-5 w-5 text-orange-700" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-orange-900 mb-2">Order Agent</h3>
                                <p className="text-sm text-orange-800 mb-2">
                                    Processes cart operations and order placement. Handles adding/removing items, updating quantities, and checkout assistance.
                                </p>
                                <div className="text-xs text-orange-700 bg-white rounded p-2">
                                    <strong>Functions:</strong> Add to cart, remove from cart, clear cart, update quantities, apply vouchers, process checkout
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Agent */}
                    <div className="border border-purple-200 rounded-lg p-5 bg-gradient-to-r from-purple-50 to-pink-50">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 shrink-0">
                                <Brain className="h-5 w-5 text-purple-700" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-purple-900 mb-2">Navigation Agent</h3>
                                <p className="text-sm text-purple-800 mb-2">
                                    Handles navigation requests, directing users to specific pages or sections of the application.
                                </p>
                                <div className="text-xs text-purple-700 bg-white rounded p-2">
                                    <strong>Destinations:</strong> Home, Menu, Cart, Checkout, Profile, Orders, About
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Guard Agent */}
                    <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 shrink-0">
                                <div className="text-gray-700 font-bold text-lg">🛡️</div>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-2">Guard Agent</h3>
                                <p className="text-sm text-gray-700 mb-2">
                                    Maintains conversation within JuiceQu domain. Redirects off-topic queries back to juice-related topics.
                                </p>
                                <div className="text-xs text-gray-600 bg-white rounded p-2">
                                    <strong>Purpose:</strong> Keep conversations relevant, prevent misuse, maintain brand focus
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Voice Agent */}
                    <div className="border border-indigo-200 rounded-lg p-5 bg-gradient-to-r from-indigo-50 to-blue-50">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 shrink-0">
                                <Mic className="h-5 w-5 text-indigo-700" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-indigo-900 mb-2">Voice Agent</h3>
                                <p className="text-sm text-indigo-800 mb-2">
                                    Specialized agent for processing voice orders. Converts speech to text and processes natural language commands.
                                </p>
                                <div className="text-xs text-indigo-700 bg-white rounded p-2">
                                    <strong>Features:</strong> Multi-language STT, natural language understanding, quantity/size extraction, confirmation
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* RAG System */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <Database className="h-5 w-5 text-green-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">RAG (Retrieval-Augmented Generation)</h2>
                </div>

                <div className="rounded-lg border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">ChromaDB Vector Database</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        JuiceQu uses ChromaDB to store product embeddings, enabling semantic search and accurate product recommendations.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">How It Works</h4>
                            <ol className="text-sm text-gray-600 space-y-1">
                                <li>1. Product data is embedded using LLM</li>
                                <li>2. Embeddings stored in ChromaDB</li>
                                <li>3. User queries converted to embeddings</li>
                                <li>4. Semantic similarity search performed</li>
                                <li>5. Relevant products retrieved</li>
                            </ol>
                        </div>
                        <div className="bg-gray-50 rounded p-4">
                            <h4 className="font-semibold text-gray-900 mb-2">Benefits</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>✅ Semantic understanding (not just keywords)</li>
                                <li>✅ Accurate product matching</li>
                                <li>✅ Context-aware recommendations</li>
                                <li>✅ Fast retrieval performance</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* LLM Integration */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                        <Cpu className="h-5 w-5 text-orange-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">LLM Integration</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                        <h3 className="font-semibold text-orange-900 mb-2">Kolosal AI</h3>
                        <p className="text-sm text-orange-800 mb-3">Primary LLM for conversation and reasoning</p>
                        <ul className="text-xs text-orange-700 space-y-1">
                            <li>• Chat completions</li>
                            <li>• Intent classification</li>
                            <li>• Response generation</li>
                            <li>• Context understanding</li>
                        </ul>
                    </div>
                    <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                        <h3 className="font-semibold text-blue-900 mb-2">Google Gemini</h3>
                        <p className="text-sm text-blue-800 mb-3">Advanced AI capabilities (optional)</p>
                        <ul className="text-xs text-blue-700 space-y-1">
                            <li>• Image understanding</li>
                            <li>• Complex reasoning</li>
                            <li>• Multi-modal processing</li>
                            <li>• Embeddings generation</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Voice Recognition */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                        <Mic className="h-5 w-5 text-purple-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Voice Recognition (STT)</h2>
                </div>

                <div className="rounded-lg border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-3">Speech-to-Text Options</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-purple-50 border border-purple-200 rounded p-4">
                            <h4 className="font-semibold text-purple-900 mb-2">🌐 Web Speech API</h4>
                            <p className="text-sm text-purple-800 mb-2">Browser-native recognition (webkitSpeechRecognition)</p>
                            <ul className="text-xs text-purple-700 space-y-1">
                                <li>✅ No additional setup required</li>
                                <li>✅ Works offline</li>
                                <li>✅ Fast processing</li>
                                <li>⚠️ Limited language support</li>
                            </ul>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded p-4">
                            <h4 className="font-semibold text-blue-900 mb-2">☁️ Google Cloud STT</h4>
                            <p className="text-sm text-blue-800 mb-2">Cloud-based recognition (optional)</p>
                            <ul className="text-xs text-blue-700 space-y-1">
                                <li>✅ Better accuracy</li>
                                <li>✅ Multi-language support</li>
                                <li>✅ Dialect recognition</li>
                                <li>⚠️ Requires API key & internet</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Agent Orchestration */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                        <Brain className="h-5 w-5 text-indigo-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Agent Orchestration</h2>
                </div>

                <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-5">
                    <h3 className="font-semibold text-indigo-900 mb-3">How Agents Work Together</h3>
                    <div className="space-y-3 text-sm text-indigo-800">
                        <div className="flex gap-3">
                            <div className="font-bold text-indigo-900">1.</div>
                            <div><strong>User Input</strong> → Received by Intent Router Agent</div>
                        </div>
                        <div className="flex gap-3">
                            <div className="font-bold text-indigo-900">2.</div>
                            <div><strong>Intent Detection</strong> → Router analyzes and classifies intent</div>
                        </div>
                        <div className="flex gap-3">
                            <div className="font-bold text-indigo-900">3.</div>
                            <div><strong>Routing</strong> → Request forwarded to appropriate specialist agent</div>
                        </div>
                        <div className="flex gap-3">
                            <div className="font-bold text-indigo-900">4.</div>
                            <div><strong>Processing</strong> → Specialist agent processes using RAG/LLM</div>
                        </div>
                        <div className="flex gap-3">
                            <div className="font-bold text-indigo-900">5.</div>
                            <div><strong>Response</strong> → Agent returns structured response</div>
                        </div>
                        <div className="flex gap-3">
                            <div className="font-bold text-indigo-900">6.</div>
                            <div><strong>Guard Check</strong> → Guard agent validates response relevance</div>
                        </div>
                        <div className="flex gap-3">
                            <div className="font-bold text-indigo-900">7.</div>
                            <div><strong>User Output</strong> → Natural language response delivered to user</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Code Example */}
            <div className="rounded-xl bg-green-600 p-6 text-white">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Implementation
                </h3>
                <p className="text-purple-100 mb-4 text-sm">
                    The AI system is implemented in <code className="bg-white/20 px-2 py-1 rounded">backend/app/services/ai/</code> with the following structure:
                </p>
                <div className="bg-black/30 rounded-lg p-4 text-xs font-mono overflow-x-auto">
                    <pre className="text-purple-100">{`services/ai/
├── agents/
│   ├── router.py              # Intent routing
│   ├── product_agent.py       # Product queries
│   ├── order_agent.py         # Cart operations
│   ├── navigation_agent.py    # Navigation
│   ├── guard_agent.py         # Context guard
│   ├── voice_agent.py         # Voice processing
│   └── orchestrator.py        # Agent coordinator
├── rag_service.py             # ChromaDB integration
└── stt_service.py             # Speech-to-Text`}</pre>
                </div>
            </div>
        </div>
    );
}
