"use client";

import { useState } from "react";
import { DocsSidebar } from "@/components/docs/sidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <DocsSidebar onClose={() => setIsSidebarOpen(false)} />
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="flex items-center border-b bg-white px-4 py-3 md:hidden">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(true)}
                        className="mr-2"
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                    <span className="font-semibold">JuiceQu Docs</span>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
                    <div className="mx-auto max-w-4xl rounded-3xl bg-white p-8 shadow-sm ring-1 ring-gray-100 md:p-12">
                        {children}
                    </div>
                    <div className="mt-8 text-center text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} JuiceQu. All rights reserved.
                    </div>
                </main>
            </div>
        </div>
    );
}
