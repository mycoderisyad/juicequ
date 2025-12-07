"use client";

import { ChevronRight, ExternalLink, Code } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ApiReferencePage() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    Technical <ChevronRight className="h-4 w-4" /> API
                </div>
                <h1 className="text-4xl font-bold text-gray-900">API Reference</h1>
                <p className="text-xl text-gray-500">
                    Complete endpoint documentation for the JuiceQu REST API.
                </p>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50 p-6">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900">Interactive Documentation</h3>
                    <p className="mt-1 text-blue-700">
                        Access the auto-generated Swagger UI for interactive testing of endpoints.
                        <br />
                        <span className="text-xs font-medium uppercase tracking-wide opacity-75">Admin Access Only</span>
                    </p>
                </div>
                <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        Open Swagger UI <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                </a>
            </div>

            <div className="space-y-12">
                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">Core Endpoints</h2>

                    <div className="overflow-hidden rounded-xl border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Method</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Endpoint</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                <tr>
                                    <td className="whitespace-nowrap px-6 py-4"><span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">GET</span></td>
                                    <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-900">/api/v1/customer/products</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">List all products with filtering</td>
                                </tr>
                                <tr>
                                    <td className="whitespace-nowrap px-6 py-4"><span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">GET</span></td>
                                    <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-900">/api/v1/customer/products/{`{id}`}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">Get detailed product info</td>
                                </tr>
                                <tr>
                                    <td className="whitespace-nowrap px-6 py-4"><span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">POST</span></td>
                                    <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-900">/api/v1/customer/orders</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">Place a new order</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900">AI Endpoints</h2>
                    <div className="rounded-xl bg-gray-900 p-6 text-gray-100">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                            <Code className="h-5 w-5 text-purple-400" />
                            Chat Completion
                        </h3>
                        <p className="mb-4 text-sm text-gray-400">POST /api/v1/ai/chat</p>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div>
                                <h4 className="mb-2 text-xs font-bold uppercase text-gray-500">Request Body</h4>
                                <pre className="rounded bg-black p-4 text-xs font-mono text-green-400">
                                    {`{
  "message": "Recommend a healthy juice",
  "history": []
}`}
                                </pre>
                            </div>
                            <div>
                                <h4 className="mb-2 text-xs font-bold uppercase text-gray-500">Response</h4>
                                <pre className="rounded bg-black p-4 text-xs font-mono text-blue-400">
                                    {`{
  "response": "Sure! Try our Green Detox...",
  "intent": "recommendation",
  "products": [...]
}`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
