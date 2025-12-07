"use client";

import { CheckCircle2, ChevronRight, Terminal, Copy, AlertTriangle, Play, Database, Code2, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function InstallationPage() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    Getting Started <ChevronRight className="h-4 w-4" /> Installation
                </div>
                <h1 className="text-4xl font-bold text-gray-900">Installation Guide</h1>
                <p className="text-xl text-gray-500">
                    Set up JuiceQu on your local machine for development. Complete setup takes approximately 10-15 minutes.
                </p>
            </div>

            {/* Video Demo */}
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <div className="aspect-video bg-gray-900 flex items-center justify-center">
                    <div className="text-center">
                        <Play className="h-16 w-16 text-white mx-auto mb-2 opacity-50" />
                        <p className="text-gray-400 text-sm">/alt/video-installation-demo.mp4</p>
                    </div>
                </div>
                <div className="p-4 bg-white">
                    <p className="text-sm text-gray-600">Installation walkthrough video (5 minutes)</p>
                </div>
            </div>

            {/* Prerequisites */}
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-6">
                <div className="flex gap-3">
                    <AlertTriangle className="h-6 w-6 text-blue-600 shrink-0 mt-1" />
                    <div className="space-y-3">
                        <h4 className="font-semibold text-blue-900 text-lg">Prerequisites</h4>
                        <p className="text-blue-800 text-sm">Make sure you have the following installed before proceeding:</p>
                        <div className="grid md:grid-cols-2 gap-3">
                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                                <div className="font-medium text-blue-900 mb-1">Python 3.11+</div>
                                <code className="text-xs text-blue-700">python --version</code>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                                <div className="font-medium text-blue-900 mb-1">Node.js 20+</div>
                                <code className="text-xs text-blue-700">node --version</code>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                                <div className="font-medium text-blue-900 mb-1">PostgreSQL 15+</div>
                                <code className="text-xs text-blue-700">psql --version</code>
                                <div className="text-xs text-blue-600 mt-1">Or use SQLite for dev</div>
                            </div>
                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                                <div className="font-medium text-blue-900 mb-1">Git</div>
                                <code className="text-xs text-blue-700">git --version</code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 1: Clone */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-bold text-green-700 text-lg">1</div>
                    <h2 className="text-2xl font-bold text-gray-900">Clone Repository</h2>
                </div>
                <p className="text-gray-600">Clone the JuiceQu repository from GitHub to your local machine.</p>
                <div className="relative rounded-lg bg-gray-900 p-4">
                    <code className="block text-sm text-gray-100 font-mono">
                        git clone https://github.com/mycoderisyad/juicequ.git<br />
                        cd juicequ
                    </code>
                </div>
            </section>

            {/* Step 2: Backend */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-bold text-green-700 text-lg">2</div>
                    <h2 className="text-2xl font-bold text-gray-900">Backend Setup (FastAPI)</h2>
                </div>
                <p className="text-gray-600">Set up the Python backend environment and install all dependencies.</p>

                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mt-6">
                    <Code2 className="h-5 w-5 text-green-600" />
                    Create Virtual Environment
                </h3>
                <div className="relative rounded-lg bg-gray-900 p-4">
                    <code className="block text-sm text-gray-100 font-mono whitespace-pre-line">
                        {`cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
.\\venv\\Scripts\\Activate.ps1

# Activate (Windows CMD)
.\\venv\\Scripts\\activate.bat

# Activate (Linux/Mac)
source venv/bin/activate`}
                    </code>
                </div>

                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mt-6">
                    <Terminal className="h-5 w-5 text-green-600" />
                    Install Dependencies
                </h3>
                <div className="relative rounded-lg bg-gray-900 p-4">
                    <code className="block text-sm text-gray-100 font-mono">
                        pip install -r requirements.txt
                    </code>
                </div>
                <p className="text-sm text-gray-500">This installs FastAPI, SQLAlchemy, Pydantic, ChromaDB, and all AI dependencies.</p>

                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mt-6">
                    <FolderTree className="h-5 w-5 text-green-600" />
                    Environment Configuration
                </h3>
                <p className="text-gray-600 text-sm">Copy the example environment file and configure your settings.</p>
                <div className="relative rounded-lg bg-gray-900 p-4">
                    <code className="block text-sm text-green-400 font-mono">
                        cp .env.example .env
                    </code>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Required Environment Variables</h4>
                    <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-3 gap-2">
                            <code className="text-blue-600 font-mono">SECRET_KEY</code>
                            <span className="col-span-2 text-gray-600">JWT secret (generate with <code className="bg-white px-1 rounded">openssl rand -hex 32</code>)</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <code className="text-blue-600 font-mono">DATABASE_URL</code>
                            <span className="col-span-2 text-gray-600">PostgreSQL connection string or <code className="bg-white px-1 rounded">sqlite:///./juicequ.db</code></span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <code className="text-blue-600 font-mono">KOLOSAL_API_KEY</code>
                            <span className="col-span-2 text-gray-600">Kolosal AI API key for LLM</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <code className="text-blue-600 font-mono">GEMINI_API_KEY</code>
                            <span className="col-span-2 text-gray-600">Google Gemini API key (optional)</span>
                        </div>
                    </div>
                </div>

                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mt-6">
                    <Database className="h-5 w-5 text-green-600" />
                    Database Migration
                </h3>
                <p className="text-gray-600 text-sm">Run Alembic migrations to create database tables.</p>
                <div className="relative rounded-lg bg-gray-900 p-4">
                    <code className="block text-sm text-gray-100 font-mono">
                        alembic upgrade head
                    </code>
                </div>

                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mt-6">
                    <Play className="h-5 w-5 text-green-600" />
                    Start Backend Server
                </h3>
                <div className="relative rounded-lg bg-gray-900 p-4">
                    <code className="block text-sm text-gray-100 font-mono">
                        uvicorn app.main:app --reload --port 8000
                    </code>
                </div>
                <p className="text-sm text-gray-500">
                    Backend runs at: <a href="http://localhost:8000" className="text-green-600 hover:underline">http://localhost:8000</a><br />
                    API Docs: <a href="http://localhost:8000/docs" className="text-green-600 hover:underline">http://localhost:8000/docs</a>
                </p>
            </section>

            {/* Step 3: Frontend */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 font-bold text-green-700 text-lg">3</div>
                    <h2 className="text-2xl font-bold text-gray-900">Frontend Setup (Next.js)</h2>
                </div>
                <p className="text-gray-600">Install Node.js packages and configure the Next.js frontend.</p>

                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mt-6">
                    <Terminal className="h-5 w-5 text-green-600" />
                    Install Dependencies
                </h3>
                <div className="relative rounded-lg bg-gray-900 p-4">
                    <code className="block text-sm text-gray-100 font-mono whitespace-pre-line">
                        {`cd ../frontend

# Install packages
npm install`}
                    </code>
                </div>

                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mt-6">
                    <FolderTree className="h-5 w-5 text-green-600" />
                    Environment Configuration
                </h3>
                <div className="relative rounded-lg bg-gray-900 p-4">
                    <code className="block text-sm text-green-400 font-mono">
                        cp .env.example .env.local
                    </code>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Frontend Environment Variables</h4>
                    <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-3 gap-2">
                            <code className="text-blue-600 font-mono text-xs">NEXT_PUBLIC_API_URL</code>
                            <span className="col-span-2 text-gray-600">http://localhost:8000/api/v1</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <code className="text-blue-600 font-mono text-xs">NEXT_PUBLIC_STORAGE_URL</code>
                            <span className="col-span-2 text-gray-600">http://localhost:8000</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <code className="text-blue-600 font-mono text-xs">NEXT_PUBLIC_ENABLE_VOICE</code>
                            <span className="col-span-2 text-gray-600">true</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <code className="text-blue-600 font-mono text-xs">NEXT_PUBLIC_ENABLE_AI_CHAT</code>
                            <span className="col-span-2 text-gray-600">true</span>
                        </div>
                    </div>
                </div>

                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mt-6">
                    <Play className="h-5 w-5 text-green-600" />
                    Start Development Server
                </h3>
                <div className="relative rounded-lg bg-gray-900 p-4">
                    <code className="block text-sm text-gray-100 font-mono">
                        npm run dev
                    </code>
                </div>
                <p className="text-sm text-gray-500">
                    Frontend runs at: <a href="http://localhost:3000" className="text-green-600 hover:underline">http://localhost:3000</a>
                </p>
            </section>

            {/* Step 4: Docker (Optional) */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700 text-lg">4</div>
                    <h2 className="text-2xl font-bold text-gray-900">Docker Compose (Optional)</h2>
                </div>
                <p className="text-gray-600">Alternative setup using Docker Compose for containerized development.</p>
                <div className="relative rounded-lg bg-gray-900 p-4">
                    <code className="block text-sm text-gray-100 font-mono whitespace-pre-line">
                        {`# From project root
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head

# View logs
docker-compose logs -f`}
                    </code>
                </div>
            </section>

            {/* Verification */}
            <section className="rounded-2xl border-2 border-green-500 bg-green-50 p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold text-green-800">
                    <CheckCircle2 className="h-6 w-6" />
                    Verify Installation
                </h3>
                <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                            <div className="font-medium text-green-900">Backend Running</div>
                            <div className="text-sm text-green-700">Visit <a href="http://localhost:8000/health" className="underline font-mono">http://localhost:8000/health</a> - should return status: healthy</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                            <div className="font-medium text-green-900">Frontend Running</div>
                            <div className="text-sm text-green-700">Visit <a href="http://localhost:3000" className="underline font-mono">http://localhost:3000</a> - should see JuiceQu homepage</div>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                            <div className="font-medium text-green-900">AI Chatbot Working</div>
                            <div className="text-sm text-green-700">Click chatbot icon (bottom-right) and ask "Show me the menu"</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Troubleshooting */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Troubleshooting</h2>
                <div className="space-y-3">
                    <details className="rounded-lg border border-gray-200 p-4">
                        <summary className="font-semibold text-gray-900 cursor-pointer">Port already in use</summary>
                        <div className="mt-3 text-sm text-gray-600 space-y-2">
                            <p>If port 8000 or 3000 is already in use:</p>
                            <code className="block bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">
                                # Find process using port<br />
                                netstat -ano | findstr :8000<br />
                                # Kill process (Windows)<br />
                                taskkill /PID &lt;PID&gt; /F
                            </code>
                        </div>
                    </details>
                    <details className="rounded-lg border border-gray-200 p-4">
                        <summary className="font-semibold text-gray-900 cursor-pointer">Database connection error</summary>
                        <div className="mt-3 text-sm text-gray-600">
                            <p>For development, use SQLite instead of PostgreSQL:</p>
                            <code className="block bg-gray-900 text-green-400 p-2 rounded font-mono text-xs mt-2">
                                DATABASE_URL=sqlite:///./juicequ.db
                            </code>
                        </div>
                    </details>
                    <details className="rounded-lg border border-gray-200 p-4">
                        <summary className="font-semibold text-gray-900 cursor-pointer">AI chatbot not responding</summary>
                        <div className="mt-3 text-sm text-gray-600">
                            <p>Make sure <code className="bg-gray-100 px-1 rounded">KOLOSAL_API_KEY</code> is set correctly in <code className="bg-gray-100 px-1 rounded">.env</code>. Check backend logs for API errors.</p>
                        </div>
                    </details>
                    <details className="rounded-lg border border-gray-200 p-4">
                        <summary className="font-semibold text-gray-900 cursor-pointer">Module not found errors</summary>
                        <div className="mt-3 text-sm text-gray-600">
                            <p>Make sure virtual environment is activated and all dependencies are installed:</p>
                            <code className="block bg-gray-900 text-green-400 p-2 rounded font-mono text-xs mt-2">
                                pip install -r requirements.txt --upgrade
                            </code>
                        </div>
                    </details>
                </div>
            </section>

            {/* Next Steps */}
            <div className="rounded-xl bg-green-600 p-6 text-white">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6" />
                    Installation Complete!
                </h3>
                <p className="text-green-50 mb-4">You&apos;re all set! Here&apos;s what to explore next:</p>
                <div className="grid md:grid-cols-2 gap-3">
                    <a href="/docs/guide/customer" className="block bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-colors">
                        <div className="font-semibold">Customer Guide →</div>
                        <div className="text-sm text-green-100">Learn how to use the app</div>
                    </a>
                    <a href="/docs/guide/architecture" className="block bg-white/10 hover:bg-white/20 rounded-lg p-3 transition-colors">
                        <div className="font-semibold">Architecture →</div>
                        <div className="text-sm text-green-100">Understand the codebase</div>
                    </a>
                </div>
            </div>
        </div>
    );
}
