"use client";

import { ChevronRight, Server, Globe, Shield, Terminal } from "lucide-react";

export default function DeploymentPage() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    Deployment <ChevronRight className="h-4 w-4" /> Docker
                </div>
                <h1 className="text-4xl font-bold text-gray-900">Deployment Guide</h1>
                <p className="text-xl text-gray-500">
                    Deploy JuiceQu to production servers using Docker and Nginx.
                </p>
            </div>

            <div className="space-y-8">
                {/* Docker Composition */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Server className="h-6 w-6 text-blue-600" />
                        <h2 className="text-2xl font-bold text-gray-900">Docker Composition</h2>
                    </div>
                    <p className="text-gray-600">
                        The project uses a multi-container Docker setup orchestrated by <code>docker-compose.yml</code>.
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border p-4">
                            <span className="font-semibold text-gray-900">frontend</span>
                            <p className="text-sm text-gray-500">Next.js standalone build (Port 3000)</p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <span className="font-semibold text-gray-900">backend</span>
                            <p className="text-sm text-gray-500">FastAPI with Gunicorn (Port 8000)</p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <span className="font-semibold text-gray-900">db</span>
                            <p className="text-sm text-gray-500">PostgreSQL 15 (Port 5432)</p>
                        </div>
                        <div className="rounded-lg border p-4">
                            <span className="font-semibold text-gray-900">nginx</span>
                            <p className="text-sm text-gray-500">Reverse Proxy & SSL Termination</p>
                        </div>
                    </div>
                </section>

                {/* Quick Start */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Terminal className="h-6 w-6 text-green-600" />
                        <h2 className="text-2xl font-bold text-gray-900">Quick Start</h2>
                    </div>
                    <div className="relative rounded-lg bg-gray-900 p-4">
                        <code className="block text-sm text-gray-100 font-mono">
                            # 1. Clone & Enter<br />
                            git clone https://github.com/yourusername/juicequ.git<br />
                            cd juicequ<br /><br />
                            # 2. Config Environment<br />
                            cp .env.example .env<br />
                            nano .env  # Edit your secrets!<br /><br />
                            # 3. Build & Run<br />
                            docker-compose up -d --build
                        </code>
                    </div>
                </section>

                {/* SSL & Domain */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <Shield className="h-6 w-6 text-purple-600" />
                        <h2 className="text-2xl font-bold text-gray-900">SSL Configuration</h2>
                    </div>
                    <p className="text-gray-600">
                        We use Nginx to handle SSL/TLS. Place your certificates in <code>nginx/ssl/</code>.
                    </p>
                    <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800 border border-yellow-100">
                        <strong>Certificate filenames:</strong>
                        <ul className="mt-1 list-disc pl-4">
                            <li><code>fullchain.pem</code> - Your public certificate</li>
                            <li><code>privkey.pem</code> - Your private key</li>
                        </ul>
                        <p className="mt-2">If using Let&apos;s Encrypt, map the volumes accordingly in docker-compose.yml.</p>
                    </div>
                </section>
            </div>
        </div>
    );
}
