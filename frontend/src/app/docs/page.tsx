"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocsHomePage() {
    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <div className="space-y-6">
                <div className="inline-flex items-center rounded-full bg-green-50 px-3 py-1">
                    <Sparkles className="mr-2 h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Project Documentation</span>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                    JuiceQu Documentation
                </h1>
                <p className="max-w-3xl text-xl text-gray-500">
                    Everything you need to know about the JuiceQu e-commerce platform.
                    Learn how to install, configure, and use the AI-powered juice shop system.
                </p>
                <div className="flex flex-wrap gap-4">
                    <Link href="/docs/installation">
                        <Button size="lg" className="rounded-full bg-green-600 hover:bg-green-700">
                            Get Started <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href="/docs/guide/architecture">
                        <Button size="lg" variant="outline" className="rounded-full">
                            System Architecture
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Features Grid */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6 transition-all hover:bg-white hover:shadow-md">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <Sparkles className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">AI-Powered</h3>
                    <p className="text-gray-500">
                        Multi-agent system handling product queries, recommendations, and voice orders in multiple languages.
                    </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6 transition-all hover:bg-white hover:shadow-md">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                        <Zap className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">Modern Stack</h3>
                    <p className="text-gray-500">
                        Built with Next.js 16, FastAPI, PostgreSQL, and vector databases for high performance.
                    </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-6 transition-all hover:bg-white hover:shadow-md">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">Secure & Scalable</h3>
                    <p className="text-gray-500">
                        Role-based access control, JWT authentication, and Docker-ready for easy deployment.
                    </p>
                </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Quick Navigation</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Link
                        href="/docs/guide/customer"
                        className="group block rounded-xl border p-5 hover:border-green-200 hover:bg-green-50/30"
                    >
                        <h4 className="font-semibold text-gray-900 group-hover:text-green-700">Customer Guide</h4>
                        <p className="text-sm text-gray-500">How to order, use voice chat, and track orders</p>
                    </Link>
                    <Link
                        href="/docs/guide/cashier"
                        className="group block rounded-xl border p-5 hover:border-green-200 hover:bg-green-50/30"
                    >
                        <h4 className="font-semibold text-gray-900 group-hover:text-green-700">Cashier Guide</h4>
                        <p className="text-sm text-gray-500">POS usage, transaction management, and reports</p>
                    </Link>
                    <Link
                        href="/docs/guide/admin"
                        className="group block rounded-xl border p-5 hover:border-green-200 hover:bg-green-50/30"
                    >
                        <h4 className="font-semibold text-gray-900 group-hover:text-green-700">Admin Guide</h4>
                        <p className="text-sm text-gray-500">System configuration, user management, and analytics</p>
                    </Link>
                    <Link
                        href="/docs/api"
                        className="group block rounded-xl border p-5 hover:border-green-200 hover:bg-green-50/30"
                    >
                        <h4 className="font-semibold text-gray-900 group-hover:text-green-700">API Reference</h4>
                        <p className="text-sm text-gray-500">Complete API documentation endpoints and schemas</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
