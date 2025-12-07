"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Settings,
    Bell,
    Moon,
    Sun,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    ChevronLeft,
    Volume2,
    Shield,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SettingsPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuthStore();

    const [isSaving, setIsSaving] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, router]);

    const handleChangePassword = async () => {
        setPasswordError("");
        setPasswordSuccess("");

        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordError("Please fill in all password fields");
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("New passwords do not match");
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordError("New password must be at least 8 characters");
            return;
        }

        setIsSaving(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    current_password: passwordData.currentPassword,
                    new_password: passwordData.newPassword,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "Failed to change password");
            }

            setPasswordSuccess("Password changed successfully!");
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error) {
            if (error instanceof Error) {
                setPasswordError(error.message);
            } else {
                setPasswordError("An error occurred while changing password");
            }
        } finally {
            setIsSaving(false);
        }
    };

    if (!isAuthenticated || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            </div>
        );
    }

    // Coming Soon Badge Component
    const ComingSoonBadge = () => (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
            <Clock className="h-3 w-3" />
            Coming Soon
        </span>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-24">
            <div className="container mx-auto max-w-2xl px-4">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href="/profile"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Profile
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                            <Settings className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                            <p className="text-sm text-gray-500">Manage your account preferences</p>
                        </div>
                    </div>
                </div>

                {/* Notifications Settings */}
                <div className="rounded-2xl bg-white p-6 shadow-sm mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Bell className="h-5 w-5 text-green-600" />
                        Notifications
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Push Notifications</p>
                                <p className="text-sm text-gray-500">Receive push notifications on your device</p>
                            </div>
                            <ComingSoonBadge />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900">Email Notifications</p>
                                <p className="text-sm text-gray-500">Receive order updates via email</p>
                            </div>
                            <ComingSoonBadge />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Volume2 className="h-4 w-4 text-gray-500" />
                                <div>
                                    <p className="font-medium text-gray-900">Sound</p>
                                    <p className="text-sm text-gray-500">Play sounds for notifications</p>
                                </div>
                            </div>
                            <ComingSoonBadge />
                        </div>
                    </div>
                </div>

                {/* Appearance Settings */}
                <div className="rounded-2xl bg-white p-6 shadow-sm mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Sun className="h-5 w-5 text-green-600" />
                        Appearance
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Moon className="h-4 w-4 text-gray-500" />
                                <div>
                                    <p className="font-medium text-gray-900">Dark Mode</p>
                                    <p className="text-sm text-gray-500">Switch to dark theme</p>
                                </div>
                            </div>
                            <ComingSoonBadge />
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="rounded-2xl bg-white p-6 shadow-sm mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-green-600" />
                        Security
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Lock className="h-4 w-4" />
                                Current Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    placeholder="Enter current password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Lock className="h-4 w-4" />
                                New Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={showNewPassword ? "text" : "password"}
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    placeholder="Enter new password (min. 8 characters)"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Lock className="h-4 w-4" />
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    placeholder="Confirm new password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {passwordError && (
                            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                                <p className="text-sm text-red-600">{passwordError}</p>
                            </div>
                        )}
                        {passwordSuccess && (
                            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                                <p className="text-sm text-green-600">{passwordSuccess}</p>
                            </div>
                        )}

                        <Button
                            onClick={handleChangePassword}
                            disabled={isSaving}
                            className="w-full bg-green-600 hover:bg-green-700 gap-2 h-12"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Lock className="h-4 w-4" />
                            )}
                            Change Password
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
