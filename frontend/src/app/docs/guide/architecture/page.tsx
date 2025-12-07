"use client";

import { ChevronRight, Server, Database, Layers, Lock, Cpu, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ArchitecturePage() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    Technical <ChevronRight className="h-4 w-4" /> Architecture
                </div>
                <h1 className="text-4xl font-bold text-gray-900">System Architecture</h1>
                <p className="text-xl text-gray-500">
                    High-level overview of the JuiceQu ecosystem, data flow, and technology stack.
                </p>
            </div>

            {/* High Level Diagram Representation */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-8">
                <h3 className="mb-6 text-center text-lg font-semibold text-gray-900">High-Level Architecture</h3>

                <div className="flex flex-col items-center gap-6">
                    {/* User Layer */}
                    <div className="flex flex-col items-center">
                        <div className="flex h-16 w-32 items-center justify-center rounded-lg border-2 border-blue-200 bg-white shadow-sm">
                            <span className="font-semibold text-blue-700">Mobile/Web</span>
                        </div>
                    </div>

                    <div className="h-8 w-0.5 bg-gray-300"></div>

                    {/* Load Balancer */}
                    <div className="flex h-12 w-48 items-center justify-center rounded-lg bg-gray-200 text-sm font-medium text-gray-700">
                        Nginx (Reverse Proxy)
                    </div>

                    <div className="h-8 w-0.5 bg-gray-300"></div>

                    {/* Services Layer */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex h-20 w-40 flex-col items-center justify-center rounded-xl border-2 border-green-200 bg-white p-2 text-center shadow-sm">
                                <Globe className="mb-1 h-5 w-5 text-green-600" />
                                <span className="font-bold text-gray-900">Frontend</span>
                                <span className="text-xs text-gray-500">Next.js 16</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex h-20 w-40 flex-col items-center justify-center rounded-xl border-2 border-purple-200 bg-white p-2 text-center shadow-sm">
                                <Server className="mb-1 h-5 w-5 text-purple-600" />
                                <span className="font-bold text-gray-900">Backend</span>
                                <span className="text-xs text-gray-500">FastAPI</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 w-full gap-8 max-w-md">
                        <div className="flex justify-center"><div className="h-8 w-0.5 bg-transparent"></div></div>
                        <div className="flex justify-center"><div className="h-8 w-0.5 bg-gray-300"></div></div>
                    </div>

                    {/* Data Layer */}
                    <div className="grid grid-cols-2 gap-8">
                        <div className="flex h-16 w-32 items-center justify-center rounded-lg border border-gray-300 bg-gray-100 p-2 shadow-inner">
                            <span className="text-sm text-gray-400">Browser Cache</span>
                        </div>
                        <div className="flex h-16 w-32 items-center justify-center rounded-lg border border-blue-300 bg-blue-50 p-2 shadow-sm">
                            <div className="flex items-center gap-2">
                                <Database className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-semibold text-blue-800">PostgreSQL</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-purple-700">
                        <Cpu className="h-6 w-6" />
                        <h2 className="text-2xl font-bold">Backend Services</h2>
                    </div>
                    <p className="text-gray-600">
                        The core logic resides in the FastAPI backend, structured with Clean Architecture principles.
                    </p>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
                            <span className="mt-1 block h-2 w-2 rounded-full bg-purple-500" />
                            <div>
                                <span className="font-semibold text-gray-900">API Layer</span>
                                <p className="text-sm text-gray-500">RESTful endpoints for web and mobile clients.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
                            <span className="mt-1 block h-2 w-2 rounded-full bg-purple-500" />
                            <div>
                                <span className="font-semibold text-gray-900">AI Agents</span>
                                <p className="text-sm text-gray-500">Multi-agent system using RAG + LLM Orchestration.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
                            <span className="mt-1 block h-2 w-2 rounded-full bg-purple-500" />
                            <div>
                                <span className="font-semibold text-gray-900">Auth Service</span>
                                <p className="text-sm text-gray-500">JWT and OAuth handling with robust security.</p>
                            </div>
                        </li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-green-700">
                        <Layers className="h-6 w-6" />
                        <h2 className="text-2xl font-bold">Frontend Stack</h2>
                    </div>
                    <p className="text-gray-600">
                        A performant Next.js 16 application with Server Side Rendering (SSR) and Client Components.
                    </p>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
                            <span className="mt-1 block h-2 w-2 rounded-full bg-green-500" />
                            <div>
                                <span className="font-semibold text-gray-900">App Router</span>
                                <p className="text-sm text-gray-500">Modern routing with nested layouts and loading states.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
                            <span className="mt-1 block h-2 w-2 rounded-full bg-green-500" />
                            <div>
                                <span className="font-semibold text-gray-900">Zustand Store</span>
                                <p className="text-sm text-gray-500">Global client state for cart, user session, and UI.</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-2 rounded-lg bg-gray-50 p-3">
                            <span className="mt-1 block h-2 w-2 rounded-full bg-green-500" />
                            <div>
                                <span className="font-semibold text-gray-900">Tailwind CSS</span>
                                <p className="text-sm text-gray-500">Utility-first styling with custom design tokens.</p>
                            </div>
                        </li>
                    </ul>
                </section>
            </div>

            <section className="rounded-xl bg-slate-900 p-6 text-white">
                <div className="flex items-center gap-2 mb-4">
                    <Lock className="h-5 w-5 text-blue-400" />
                    <h3 className="text-lg font-bold">Security Architecture</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-6 text-sm text-slate-300">
                    <div>
                        <h4 className="font-semibold text-white mb-1">Authentication</h4>
                        <p>HTTPOnly Cookies for JWT storage to prevent XSS attacks. CSRF tokens for all state-changing operations.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-1">Authorization</h4>
                        <p>Role-Based Access Control (RBAC) middleware ensures users (Customer, Cashier, Admin) only access permitted resources.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-1">Data Protection</h4>
                        <p>Data validation with Pydantic v2. Password hashing with bcrypt. SQL injection prevention via SQLAlchemy ORM.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-1">Network</h4>
                        <p>All traffic encrypted via TLS 1.2+ in production. Rate limiting and CORS policies configured.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
