"use client";

import { ChevronRight, Layers, Database, Cpu, FolderTree, GitBranch, Image as ImageIcon, Server, Monitor, ArrowDown, Shield, Network, Brain, Sparkles, ArrowRight, ArrowLeft } from "lucide-react";

export default function ArchitecturePage() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    Technical <ChevronRight className="h-4 w-4" /> Architecture
                </div>
                <h1 className="text-4xl font-bold text-gray-900">System Architecture</h1>
                <p className="text-xl text-gray-500 mb-8">
                    Technical overview of JuiceQu's architecture, tech stack, and project structure.
                </p>

                {/* Architecture Diagram */}
                <div className="p-8 overflow-x-auto mb-12">
                    <div className="min-w-[700px] flex flex-col items-center gap-8">

                        {/* Client Layer */}
                        <div className="flex flex-col items-center gap-2">
                            <div className="px-6 py-3 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg flex items-center gap-2">
                                <Monitor className="h-5 w-5 text-black" />
                                <span className="font-bold text-black">CLIENT APPLICATIONS</span>
                            </div>
                            <ArrowDown className="h-6 w-6 text-black" />
                        </div>

                        {/* Middle Layer */}
                        <div className="w-full grid grid-cols-2 gap-8 items-start relative">
                            {/* Horizontal Connector Line */}
                            <div className="absolute top-1/2 left-[25%] right-[25%] h-0.5 bg-black -z-10 hidden md:block"></div>

                            {/* Frontend */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-full bg-white border-2 border-black p-4 rounded-lg relative">
                                    <div className="absolute -top-3 left-4 bg-black text-white px-2 py-0.5 text-xs font-bold uppercase">Frontend Layer</div>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        <div className="p-2 border border-gray-200 text-center rounded">
                                            <div className="font-bold text-sm text-black">Next.js</div>
                                        </div>
                                        <div className="p-2 border border-gray-200 text-center rounded">
                                            <div className="font-bold text-sm text-black">React</div>
                                        </div>
                                        <div className="p-2 border border-gray-200 text-center rounded">
                                            <div className="font-bold text-sm text-black">Zustand</div>
                                        </div>
                                    </div>
                                </div>
                                <ArrowDown className="h-6 w-6 text-black" />
                            </div>

                            {/* Backend */}
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-full bg-white border-2 border-black p-4 rounded-lg relative">
                                    <div className="absolute -top-3 left-4 bg-black text-white px-2 py-0.5 text-xs font-bold uppercase">Backend Layer</div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div className="p-2 border border-gray-200 text-center rounded bg-gray-50">
                                            <div className="font-bold text-xs text-black">FastAPI REST</div>
                                        </div>
                                        <div className="p-2 border border-gray-200 text-center rounded bg-gray-50">
                                            <div className="font-bold text-xs text-black">Auth (JWT)</div>
                                        </div>
                                        <div className="col-span-2 p-2 border border-gray-200 text-center rounded bg-gray-50">
                                            <div className="font-bold text-xs text-black flex items-center justify-center gap-2">
                                                <Brain className="h-3 w-3 text-black" /> AI Orchestrator
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <ArrowDown className="h-6 w-6 text-black" />
                            </div>
                        </div>

                        {/* Bottom Layer */}
                        <div className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50">
                            <div className="text-center mb-4 font-bold text-gray-500 text-sm tracking-widest uppercase mb-6">INFRASTRUCTURE & DATA</div>
                            <div className="flex justify-center gap-8">
                                <div className="bg-white border-2 border-black p-4 rounded-lg min-w-[150px] text-center shadow-sm">
                                    <Database className="h-6 w-6 mx-auto mb-2 text-black" />
                                    <div className="font-bold text-sm text-black">PostgreSQL</div>
                                    <div className="text-xs text-gray-600">Primary Data</div>
                                </div>

                                {/* Horizontal Arrows */}
                                <div className="flex items-center text-gray-400">
                                    <ArrowRight className="h-5 w-5 text-black" />
                                    <ArrowLeft className="h-5 w-5 text-black" />
                                </div>

                                <div className="bg-white border-2 border-black p-4 rounded-lg min-w-[150px] text-center shadow-sm">
                                    <Sparkles className="h-6 w-6 mx-auto mb-2 text-black" />
                                    <div className="font-bold text-sm text-black">AI Services</div>
                                    <div className="text-xs text-gray-600">Kolosal & Chroma</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Tech Stack */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <Layers className="h-5 w-5 text-blue-700" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Tech Stack</h2>
                    </div>

                    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-semibold text-blue-900 mb-3">Frontend</h3>
                                <ul className="space-y-2 text-sm text-blue-800">
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                        <strong>Next.js 16</strong> - React framework with App Router
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                        <strong>TypeScript</strong> - Type-safe JavaScript
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                        <strong>Tailwind CSS</strong> - Utility-first CSS framework
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                        <strong>Zustand</strong> - State management
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                        <strong>ShadCN UI</strong> - Component library
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-900 mb-3">Backend</h3>
                                <ul className="space-y-2 text-sm text-blue-800">
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                        <strong>Python 3.11+</strong> - Programming language
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                        <strong>FastAPI</strong> - Modern async web framework
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                        <strong>SQLAlchemy</strong> - ORM for database management
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                        <strong>Pydantic</strong> - Data validation
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                        <strong>Alembic</strong> - Database migrations
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                            <Database className="h-8 w-8 text-purple-600 mb-2" />
                            <h3 className="font-semibold text-gray-900 mb-2">Database</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• PostgreSQL 15+ (Production)</li>
                                <li>• SQLite (Development)</li>
                                <li>• ChromaDB (Vector DB)</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                            <Cpu className="h-8 w-8 text-orange-600 mb-2" />
                            <h3 className="font-semibold text-gray-900 mb-2">AI/LLM</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Kolosal AI API</li>
                                <li>• Google Gemini</li>
                                <li>• Google Cloud STT (optional)</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                            <GitBranch className="h-8 w-8 text-blue-600 mb-2" />
                            <h3 className="font-semibold text-gray-900 mb-2">DevOps</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Docker & Docker Compose</li>
                                <li>• GitHub Actions (CI/CD)</li>
                                <li>• VPS Deployment</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Project Structure */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                            <FolderTree className="h-5 w-5 text-green-700" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Project Structure</h2>
                    </div>

                    <p className="text-gray-600">Complete directory structure of the JuiceQu monorepo.</p>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 overflow-x-auto">
                        <pre className="text-xs font-mono text-gray-800 leading-relaxed">{`juicequ/
├── backend/                      # FastAPI Backend
│   ├── app/
│   │   ├── api/v1/endpoints/    # REST API endpoints
│   │   │   ├── admin/           # Admin routes (products, users, analytics)
│   │   │   ├── cashier/         # Cashier routes (POS, transactions)
│   │   │   ├── customer/        # Customer routes (cart, orders, profile)
│   │   │   ├── ai_chat.py       # AI chatbot endpoint
│   │   │   └── auth.py          # Authentication endpoints
│   │   ├── core/                # Config, auth, middleware
│   │   │   ├── auth.py          # JWT authentication
│   │   │   ├── dependencies.py  # FastAPI dependencies
│   │   │   ├── exceptions.py    # Custom exceptions
│   │   │   └── rate_limit.py    # Rate limiting middleware
│   │   ├── db/                  # Database setup
│   │   │   └── session.py       # SQLAlchemy session management
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── order.py
│   │   │   └── voucher.py
│   │   ├── schemas/             # Pydantic schemas
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   └── order.py
│   │   └── services/            # Business logic
│   │       ├── ai/              # AI services
│   │       │   ├── agents/      # Multi-agent system
│   │       │   │   ├── router.py           # Intent router agent
│   │       │   │   ├── product_agent.py    # Product info agent
│   │       │   │   ├── order_agent.py      # Order processing agent
│   │       │   │   ├── navigation_agent.py # Navigation agent
│   │       │   │   ├── guard_agent.py      # Context guard agent
│   │       │   │   ├── voice_agent.py      # Voice order agent
│   │       │   │   └── orchestrator.py     # Agent orchestrator
│   │       │   ├── rag_service.py          # RAG (ChromaDB)
│   │       │   └── stt_service.py          # Speech-to-Text
│   │       ├── auth_service.py
│   │       ├── product_service.py
│   │       └── order_service.py
│   ├── alembic/                 # Database migrations
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                     # Next.js Frontend
│   └── src/
│       ├── app/                 # App Router pages
│       │   ├── admin/           # Admin pages
│       │   │   ├── products/    # Product management
│       │   │   ├── users/       # User management
│       │   │   ├── vouchers/    # Voucher management
│       │   │   └── analytics/   # Analytics dashboard
│       │   ├── cashier/         # Cashier pages
│       │   │   ├── pos/         # Point of Sale
│       │   │   ├── orders/      # Order management
│       │   │   └── reports/     # Daily reports
│       │   ├── cart/            # Shopping cart
│       │   ├── checkout/        # Checkout flow
│       │   ├── menu/            # Product listing
│       │   ├── orders/          # Order history
│       │   ├── profile/         # User profile
│       │   ├── docs/            # Documentation pages
│       │   └── page.tsx         # Homepage
│       ├── components/          # React components
│       │   ├── admin/           # Admin components
│       │   ├── cashier/         # Cashier components
│       │   ├── chat/            # AI chatbot UI
│       │   ├── layout/          # Header, Footer, Sidebar
│       │   ├── products/        # Product cards, filters
│       │   └── ui/              # Reusable UI (ShadCN)
│       ├── lib/                 # Utilities
│       │   ├── api/             # API client modules
│       │   ├── hooks/           # Custom React hooks
│       │   ├── store.ts         # Zustand stores
│       │   └── utils.ts         # Helper functions
│       └── locales/             # i18n translations
│           ├── id.json          # Indonesian
│           ├── en.json          # English
│           ├── jv.json          # Javanese
│           └── su.json          # Sundanese
│
├── docs/                        # Documentation
│   └── VPS_DEPLOYMENT.md        # VPS deployment guide
├── scripts/                     # Utility scripts
│   └── backup.sh                # Database backup script
├── .github/workflows/           # CI/CD pipelines
│   ├── ci-cd.yml                # Main pipeline
│   └── security.yml             # Security scanning
├── docker-compose.yml           # Docker orchestration
├── .env.example                 # Environment template
└── README.md`}</pre>
                    </div>
                </section>

                {/* Backend Architecture */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                            <Cpu className="h-5 w-5 text-purple-700" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Backend Architecture</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">API Layer</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• RESTful API with FastAPI</li>
                                <li>• Automatic OpenAPI docs</li>
                                <li>• Route-based organization</li>
                                <li>• Versioned endpoints (/api/v1)</li>
                                <li>• JWT authentication</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Data Layer</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• SQLAlchemy ORM</li>
                                <li>• Alembic migrations</li>
                                <li>• Pydantic schemas</li>
                                <li>• Database pooling</li>
                                <li>• Query optimization</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Business Logic</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Service layer pattern</li>
                                <li>• Domain-driven design</li>
                                <li>• Dependency injection</li>
                                <li>• Transaction management</li>
                                <li>• Error handling</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Security</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• JWT token-based auth</li>
                                <li>• CSRF protection</li>
                                <li>• Rate limiting</li>
                                <li>• CORS configuration</li>
                                <li>• Input validation</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Frontend Architecture */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                            <Layers className="h-5 w-5 text-orange-700" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Frontend Architecture</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Routing</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Next.js App Router</li>
                                <li>• File-based routing</li>
                                <li>• Nested layouts</li>
                                <li>• Server & client components</li>
                                <li>• Dynamic routes</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">State Management</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Zustand stores</li>
                                <li>• Auth state (user, tokens)</li>
                                <li>• Cart state</li>
                                <li>• UI state (modals, toasts)</li>
                                <li>• Persistent storage</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Data Fetching</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• API client module</li>
                                <li>• React hooks (useQuery)</li>
                                <li>• SWR for caching</li>
                                <li>• Optimistic updates</li>
                                <li>• Error boundaries</li>
                            </ul>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Styling & UI</h3>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• Tailwind CSS utilities</li>
                                <li>• ShadCN UI components</li>
                                <li>• Responsive design</li>
                                <li>• Dark mode support</li>
                                <li>• Custom animations</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Database Schema */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                            <Database className="h-5 w-5 text-indigo-700" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Database Schema</h2>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-5">
                        <h3 className="font-semibold text-gray-900 mb-3">Main Tables</h3>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 rounded p-3">
                                <div className="font-mono font-semibold text-indigo-900 mb-1">users</div>
                                <div className="text-gray-600 text-xs space-y-0.5">
                                    <div>• id, email, password_hash</div>
                                    <div>• name, phone, role</div>
                                    <div>• created_at, updated_at</div>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded p-3">
                                <div className="font-mono font-semibold text-green-900 mb-1">products</div>
                                <div className="text-gray-600 text-xs space-y-0.5">
                                    <div>• id, name, description</div>
                                    <div>• base_price, category_id</div>
                                    <div>• images, ingredients, nutrition</div>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded p-3">
                                <div className="font-mono font-semibold text-orange-900 mb-1">orders</div>
                                <div className="text-gray-600 text-xs space-y-0.5">
                                    <div>• id, user_id, status</div>
                                    <div>• total_amount, payment_method</div>
                                    <div>• order_items (JSON)</div>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded p-3">
                                <div className="font-mono font-semibold text-purple-900 mb-1">vouchers</div>
                                <div className="text-gray-600 text-xs space-y-0.5">
                                    <div>• id, code, discount_type</div>
                                    <div>• discount_value, min_purchase</div>
                                    <div>• valid_from, valid_until</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* API Routing */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <GitBranch className="h-5 w-5 text-blue-700" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">API Routing Structure</h2>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 overflow-x-auto">
                        <pre className="text-xs font-mono text-gray-800 leading-relaxed">{`/api/v1
├── /auth                  # Authentication
│   ├── POST /register     # User registration
│   ├── POST /login        # User login
│   ├── POST /refresh      # Refresh token
│   └── POST /logout       # Logout
│
├── /customer              # Customer endpoints
│   ├── /products          # Product catalog
│   ├── /cart              # Shopping cart
│   ├── /orders            # Order management
│   └── /profile           # User profile
│
├── /cashier               # Cashier endpoints
│   ├── /pos               # Point of Sale
│   ├── /transactions      # Transaction history
│   └── /reports           # Daily reports
│
├── /admin                 # Admin endpoints
│   ├── /products          # Product CRUD
│   ├── /categories        # Category management
│   ├── /users             # User management
│   ├── /vouchers          # Voucher management
│   ├── /settings          # System settings
│   └── /analytics         # Business analytics
│
└── /ai                    # AI services
    ├── POST /chat         # AI chatbot
    └── POST /voice        # Voice recognition`}</pre>
                    </div>
                </section>

                {/* Deployment */}
                <div className="rounded-xl bg-green-600 p-6 text-white">
                    <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        Deployment Architecture
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm text-indigo-50">
                        <div>
                            <div className="font-semibold mb-1">Development</div>
                            <div>• Local servers (uvicorn, npm dev)</div>
                            <div>• SQLite database</div>
                            <div>• Hot reload enabled</div>
                        </div>
                        <div>
                            <div className="font-semibold mb-1">Production (VPS)</div>
                            <div>• Docker Compose orchestration</div>
                            <div>• PostgreSQL database</div>
                            <div>• Nginx reverse proxy</div>
                            <div>• GitHub Actions CI/CD</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
