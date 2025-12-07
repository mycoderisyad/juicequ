"use client";

import { CheckCircle2, ChevronRight, Terminal, Copy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InstallationPage() {
    return (
        <div className="space-y-8 max-w-3xl">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    Getting Started <ChevronRight className="h-4 w-4" /> Installation
                </div>
                <h1 className="text-4xl font-bold text-gray-900">Installation Guide</h1>
                <p className="text-xl text-gray-500">
                    Set up JuiceQu on your local machine for development in less than 10 minutes.
                </p>
            </div>

            <div className="rounded-xl bg-blue-50 p-4 text-blue-800 flex gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div>
                    <h4 className="font-semibold">Prerequisites</h4>
                    <ul className="mt-2 list-disc pl-4 space-y-1 text-sm">
                        <li>Python 3.11 or higher</li>
                        <li>Node.js 20 or higher</li>
                        <li>PostgreSQL 15+ (or use SQLite for dev)</li>
                    </ul>
                </div>
            </div>

            <div className="space-y-8">
                {/* Step 1 */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-bold text-green-700">1</div>
                        <h2 className="text-2xl font-bold text-gray-900">Clone Repository</h2>
                    </div>
                    <div className="relative rounded-lg bg-gray-900 p-4">
                        <code className="block text-sm text-gray-100 font-mono">
                            git clone https://github.com/yourusername/juicequ.git<br />
                            cd juicequ
                        </code>
                    </div>
                </section>

                {/* Step 2 */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-bold text-green-700">2</div>
                        <h2 className="text-2xl font-bold text-gray-900">Backend Setup</h2>
                    </div>
                    <p className="text-gray-600">
                        Set up the Python environment and install dependencies.
                    </p>
                    <div className="relative rounded-lg bg-gray-900 p-4">
                        <code className="block text-sm text-gray-100 font-mono">
                            cd backend<br />
                            # Create venv<br />
                            python -m venv venv<br />
                            <br />
                            # Activate (Windows)<br />
                            .\venv\Scripts\Activate.ps1<br />
                            <br />
                            # Install deps<br />
                            pip install -r requirements.txt
                        </code>
                    </div>

                    <div className="mt-4 space-y-2">
                        <h3 className="font-semibold text-gray-900">Environment Configuration</h3>
                        <p className="text-gray-600 text-sm">Copy the example file and update your keys.</p>
                        <div className="relative rounded-lg bg-gray-900 p-4">
                            <code className="block text-sm text-green-400 font-mono">
                                cp .env.example .env
                            </code>
                        </div>
                    </div>
                </section>

                {/* Step 3 */}
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-bold text-green-700">3</div>
                        <h2 className="text-2xl font-bold text-gray-900">Frontend Setup</h2>
                    </div>
                    <p className="text-gray-600">
                        Install Node.js packages and start the Next.js server.
                    </p>
                    <div className="relative rounded-lg bg-gray-900 p-4">
                        <code className="block text-sm text-gray-100 font-mono">
                            cd frontend<br />
                            npm install<br />
                            <br />
                            # Configure environment<br />
                            cp .env.example .env.local<br />
                            <br />
                            # Start server<br />
                            npm run dev
                        </code>
                    </div>
                </section>

                {/* Verification */}
                <section className="rounded-2xl border border-green-100 bg-green-50 p-6">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-green-800">
                        <CheckCircle2 className="h-5 w-5" />
                        Verify Installation
                    </h3>
                    <p className="mt-2 text-green-700">
                        Open <a href="http://localhost:3000" className="underline font-semibold hover:text-green-900">http://localhost:3000</a> in your browser.
                        You should see the JuiceQu homepage. Try interacting with the chatbot to verify AI connectivity.
                    </p>
                </section>
            </div>
        </div>
    );
}
