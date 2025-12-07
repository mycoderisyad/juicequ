"use client";

import { ChevronRight, Code, Lock, Server, Zap, CheckCircle } from "lucide-react";

export default function APIReferencePage() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    Technical <ChevronRight className="h-4 w-4" /> API Reference
                </div>
                <h1 className="text-4xl font-bold text-gray-900">API Reference</h1>
                <p className="text-xl text-gray-500">
                    Complete REST API documentation for JuiceQu backend endpoints.
                </p>
            </div>

            {/* Quick Access */}
            <div className="rounded-xl border-2 border-green-500 bg-green-50 p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold text-green-800 mb-3">
                    <Zap className="h-6 w-6" />
                    Interactive API Documentation
                </h3>
                <p className="text-green-700 mb-4">
                    Access the interactive Swagger UI documentation for live testing and detailed schemas:
                </p>
                <div className="flex gap-3">
                    <a
                        href="http://localhost:8000/docs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Code className="h-4 w-4" />
                        Swagger UI (Development)
                    </a>
                    <a
                        href="http://localhost:8000/redoc"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <Server className="h-4 w-4" />
                        ReDoc
                    </a>
                </div>
            </div>

            {/* Base URL */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                        <Server className="h-5 w-5 text-blue-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Base URL</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Development</div>
                        <code className="text-blue-600 font-mono">http://localhost:8000/api/v1</code>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Production</div>
                        <code className="text-green-600 font-mono">https://your-domain.com/api/v1</code>
                    </div>
                </div>
            </section>

            {/* Authentication */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                        <Lock className="h-5 w-5 text-purple-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Authentication</h2>
                </div>

                <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-5">
                    <h3 className="font-semibold text-purple-900 mb-3">JWT Token Authentication</h3>
                    <p className="text-sm text-purple-800 mb-4">
                        JuiceQu uses JWT (JSON Web Tokens) stored in HttpOnly cookies for secure authentication.
                    </p>

                    <div className="bg-white rounded-lg p-4 border border-purple-100">
                        <h4 className="font-semibold text-purple-900 mb-2">Authentication Flow</h4>
                        <ol className="text-sm text-purple-800 space-y-1">
                            <li>1. Client sends credentials to <code className="bg-purple-100 px-1 rounded">/auth/login</code></li>
                            <li>2. Server validates and returns JWT tokens in HttpOnly cookies</li>
                            <li>3. Client includes cookies automatically in subsequent requests</li>
                            <li>4. Server validates JWT from cookies on protected routes</li>
                        </ol>
                    </div>

                    <div className="mt-4 bg-white rounded-lg p-4 border border-purple-100">
                        <h4 className="font-semibold text-purple-900 mb-2">Cookies Used</h4>
                        <ul className="text-sm text-purple-800 space-y-1">
                            <li>• <code className="bg-purple-100 px-1 rounded">access_token</code> - Short-lived (30 min), used for API requests</li>
                            <li>• <code className="bg-purple-100 px-1 rounded">refresh_token</code> - Long-lived (7 days), used to refresh access token</li>
                            <li>• <code className="bg-purple-100 px-1 rounded">csrf_token</code> - CSRF protection token</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Auth Endpoints */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Authentication Endpoints</h2>

                <div className="space-y-3">
                    {/* Register */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">POST</span>
                            <code className="text-sm font-mono text-gray-800">/auth/register</code>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Register new user account</p>
                        <details className="text-sm">
                            <summary className="font-semibold cursor-pointer text-gray-900">Request Body</summary>
                            <pre className="bg-gray-900 text-green-400 p-3 rounded mt-2 overflow-x-auto text-xs">{`{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "phone": "+6281234567890"
}`}</pre>
                        </details>
                    </div>

                    {/* Login */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">POST</span>
                            <code className="text-sm font-mono text-gray-800">/auth/login</code>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">Login with email and password</p>
                        <details className="text-sm">
                            <summary className="font-semibold cursor-pointer text-gray-900">Request Body</summary>
                            <pre className="bg-gray-900 text-green-400 p-3 rounded mt-2 overflow-x-auto text-xs">{`{
  "email": "user@example.com",
  "password": "SecurePass123"
}`}</pre>
                        </details>
                    </div>

                    {/* Refresh */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">POST</span>
                            <code className="text-sm font-mono text-gray-800">/auth/refresh</code>
                        </div>
                        <p className="text-sm text-gray-600">Refresh access token using refresh token</p>
                    </div>

                    {/* Logout */}
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">POST</span>
                            <code className="text-sm font-mono text-gray-800">/auth/logout</code>
                        </div>
                        <p className="text-sm text-gray-600">Logout and clear auth cookies</p>
                    </div>
                </div>
            </section>

            {/* Customer Endpoints */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Customer Endpoints</h2>

                <div className="space-y-3">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">GET</span>
                            <code className="text-sm font-mono text-gray-800">/customer/products</code>
                        </div>
                        <p className="text-sm text-gray-600">Get all products (public, no auth required)</p>
                        <div className="text-xs text-gray-500 mt-2">Query params: category, search, sort</div>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">GET</span>
                            <code className="text-sm font-mono text-gray-800">/customer/products/{'{product_id}'}</code>
                        </div>
                        <p className="text-sm text-gray-600">Get product details by ID</p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">POST</span>
                            <code className="text-sm font-mono text-gray-800">/customer/orders</code>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Create new order (requires authentication)</p>
                        <span className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            <Lock className="h-3 w-3" /> Protected
                        </span>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">GET</span>
                            <code className="text-sm font-mono text-gray-800">/customer/orders</code>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Get user&apos;s order history</p>
                        <span className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            <Lock className="h-3 w-3" /> Protected
                        </span>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">GET</span>
                            <code className="text-sm font-mono text-gray-800">/customer/profile</code>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Get user profile information</p>
                        <span className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                            <Lock className="h-3 w-3" /> Protected
                        </span>
                    </div>
                </div>
            </section>

            {/* Admin Endpoints */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Admin Endpoints</h2>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                    <div className="flex items-center gap-2 text-red-800">
                        <Lock className="h-5 w-5" />
                        <span className="font-semibold">All admin endpoints require admin role authentication</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">POST</span>
                            <code className="text-sm font-mono text-gray-800">/admin/products</code>
                        </div>
                        <p className="text-sm text-gray-600">Create new product</p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded">PUT</span>
                            <code className="text-sm font-mono text-gray-800">/admin/products/{'{product_id}'}</code>
                        </div>
                        <p className="text-sm text-gray-600">Update product details</p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">DELETE</span>
                            <code className="text-sm font-mono text-gray-800">/admin/products/{'{product_id}'}</code>
                        </div>
                        <p className="text-sm text-gray-600">Delete product</p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">GET</span>
                            <code className="text-sm font-mono text-gray-800">/admin/analytics</code>
                        </div>
                        <p className="text-sm text-gray-600">Get business analytics and reports</p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">GET</span>
                            <code className="text-sm font-mono text-gray-800">/admin/users</code>
                        </div>
                        <p className="text-sm text-gray-600">Get all users with filtering options</p>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">POST</span>
                            <code className="text-sm font-mono text-gray-800">/admin/vouchers</code>
                        </div>
                        <p className="text-sm text-gray-600">Create discount voucher</p>
                    </div>
                </div>
            </section>

            {/* AI Endpoints */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">AI Chat Endpoints</h2>

                <div className="space-y-3">
                    <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">POST</span>
                            <code className="text-sm font-mono text-gray-800">/ai/chat</code>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">Send message to AI chatbot</p>
                        <details className="text-sm">
                            <summary className="font-semibold cursor-pointer text-gray-900">Request Body</summary>
                            <pre className="bg-gray-900 text-green-400 p-3 rounded mt-2 overflow-x-auto text-xs">{`{
  "message": "Show me fresh juices",
  "locale": "id"
}`}</pre>
                        </details>
                    </div>

                    <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">POST</span>
                            <code className="text-sm font-mono text-gray-800">/ai/voice</code>
                        </div>
                        <p className="text-sm text-gray-700">Process voice input (Speech-to-Text + AI processing)</p>
                    </div>
                </div>
            </section>

            {/* Response Codes */}
            <section className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Response Status Codes</h2>

                <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                        <div className="font-semibold text-green-900 mb-1">200 OK</div>
                        <div className="text-sm text-green-700">Request successful</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                        <div className="font-semibold text-green-900 mb-1">201 Created</div>
                        <div className="text-sm text-green-700">Resource created successfully</div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                        <div className="font-semibold text-yellow-900 mb-1">400 Bad Request</div>
                        <div className="text-sm text-yellow-700">Invalid request data</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                        <div className="font-semibold text-red-900 mb-1">401 Unauthorized</div>
                        <div className="text-sm text-red-700">Authentication required</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                        <div className="font-semibold text-red-900 mb-1">403 Forbidden</div>
                        <div className="text-sm text-red-700">Insufficient permissions</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                        <div className="font-semibold text-red-900 mb-1">404 Not Found</div>
                        <div className="text-sm text-red-700">Resource not found</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded p-3">
                        <div className="font-semibold text-orange-900 mb-1">422 Validation Error</div>
                        <div className="text-sm text-orange-700">Request validation failed</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                        <div className="font-semibold text-red-900 mb-1">500 Server Error</div>
                        <div className="text-sm text-red-700">Internal server error</div>
                    </div>
                </div>
            </section>

            {/* Next Steps */}
            <div className="rounded-xl bg-green-600 p-6 text-white">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Full API Documentation
                </h3>
                <p className="text-blue-100 mb-4">
                    For complete endpoint documentation with request/response schemas, examples, and live testing:
                </p>
                <div className="flex gap-3">
                    <a
                        href="http://localhost:8000/docs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Open Swagger UI →
                    </a>
                </div>
            </div>
        </div>
    );
}
