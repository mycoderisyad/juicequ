"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Book,
    Code,
    Terminal,
    Cpu,
    Shield,
    ShoppingCart,
    Monitor,
    Settings,
    Menu,
    X,
    Server
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface DocsSidebarProps {
    className?: string;
    onClose?: () => void;
}

export function DocsSidebar({ className, onClose }: DocsSidebarProps) {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    const sections = [
        {
            title: "Getting Started",
            items: [
                { title: "Introduction", href: "/docs", icon: Book },
                { title: "Installation", href: "/docs/installation", icon: Terminal },
            ],
        },
        {
            title: "User Guides",
            items: [
                { title: "Customer Guide", href: "/docs/guide/customer", icon: ShoppingCart },
                { title: "Cashier Guide", href: "/docs/guide/cashier", icon: Monitor },
                { title: "Admin Guide", href: "/docs/guide/admin", icon: Settings },
            ],
        },
        {
            title: "Technical",
            items: [
                { title: "Architecture", href: "/docs/guide/architecture", icon: Server },
                { title: "AI System", href: "/docs/guide/ai-system", icon: Cpu },
                { title: "API Reference", href: "/docs/api", icon: Code },
            ],
        },
        {
            title: "Deployment",
            items: [
                { title: "Deployment Guide", href: "/docs/deployment", icon: Shield },
            ],
        },
    ];

    return (
        <div className={cn("flex h-full flex-col border-r bg-white", className)}>
            <div className="flex items-center justify-between border-b px-6 py-4">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-lime-600 bg-clip-text text-transparent">
                        JuiceQu Docs
                    </span>
                </Link>
                {onClose && (
                    <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
                        <X className="h-5 w-5" />
                    </Button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-6 px-4">
                    {sections.map((section) => (
                        <div key={section.title}>
                            <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                {section.title}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onClose}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                                            isActive(item.href)
                                                ? "bg-green-50 text-green-700"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        <item.icon className={cn("h-4 w-4", isActive(item.href) ? "text-green-600" : "text-gray-400")} />
                                        {item.title}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            <div className="border-t p-4">
                <div className="rounded-xl bg-gradient-to-br from-green-600 to-lime-600 p-4 text-white">
                    <h4 className="font-semibold">Need Help?</h4>
                    <p className="mt-1 text-xs text-green-100">
                        Check the API reference or contact support for assistance.
                    </p>
                    <Link href="/docs/api">
                        <Button size="sm" variant="secondary" className="mt-3 w-full bg-white text-green-700 hover:bg-green-50">
                            View API Docs
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
