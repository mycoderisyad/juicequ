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

            {/* Sidebar - Fixed/Sticky on Desktop */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <DocsSidebar onClose={() => setIsSidebarOpen(false)} />
            </aside>

            {/* Main Content - Add left margin to account for fixed sidebar on desktop */}
            <div className="flex flex-1 flex-col md:ml-72">
                {/* Mobile Header */}
                <header className="sticky top-0 z-30 flex items-center border-b bg-white px-4 py-3 md:hidden">
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

                <main className="flex-1 p-6 md:p-10 lg:p-12">
                    <div className="mx-auto max-w-5xl">
                        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 md:p-12">
                            {children}
                        </div>
                        <div className="mt-8 text-center text-sm text-gray-400">
                            &copy; {new Date().getFullYear()} JuiceQu. All rights reserved.
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
