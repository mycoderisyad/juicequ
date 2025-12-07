"use client";

import { ChevronRight, Construction } from "lucide-react";

export default function AdminGuidePage() {
    return (
        <div className="space-y-8 max-w-3xl">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    User Guides <ChevronRight className="h-4 w-4" /> Admin
                </div>
                <h1 className="text-4xl font-bold text-gray-900">Admin Guide</h1>
            </div>

            <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 py-16 text-center">
                <Construction className="mb-4 h-12 w-12 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900">Under Construction</h3>
                <p className="max-w-md text-gray-500 mt-2">
                    We are currently writing detailed documentation for the admin dashboard.
                    Please check back later.
                </p>
            </div>
        </div>
    );
}
