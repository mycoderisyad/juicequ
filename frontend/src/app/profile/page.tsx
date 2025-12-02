"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit2, 
  Save, 
  X, 
  ShoppingBag,
  LogOut,
  Loader2,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(() => ({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
  }));

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Update form when starting to edit
  const handleStartEdit = () => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        address: "",
      });
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement API call to update profile
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700";
      case "kasir":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-green-100 text-green-700";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "kasir":
        return "Cashier";
      default:
        return "Customer";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-24">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Profile Header */}
        <div className="mb-6 rounded-2xl bg-linear-to-r from-green-600 to-green-500 p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-bold">
              {(user.full_name || user.email)[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user.full_name || "User"}</h1>
              <p className="text-green-100">{user.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                  <Shield className="h-3 w-3" />
                  {getRoleLabel(user.role)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEdit}
                className="gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="h-4 w-4" />
                Full Name
              </label>
              {isEditing ? (
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Your name"
                />
              ) : (
                <p className="rounded-lg bg-gray-50 px-4 py-3 text-gray-900">
                  {user?.full_name || "-"}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <p className="rounded-lg bg-gray-100 px-4 py-3 text-gray-600">
                {user?.email}
                <span className="ml-2 text-xs text-gray-400">(cannot be changed)</span>
              </p>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone className="h-4 w-4" />
                Phone Number
              </label>
              {isEditing ? (
                <Input
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+62 812 3456 7890"
                />
              ) : (
                <p className="rounded-lg bg-gray-50 px-4 py-3 text-gray-900">
                  {user?.phone_number || "-"}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin className="h-4 w-4" />
                Address
              </label>
              {isEditing ? (
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Your delivery address"
                  className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  rows={3}
                />
              ) : (
                <p className="rounded-lg bg-gray-50 px-4 py-3 text-gray-900">
                  {formData.address || "-"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => router.push("/orders")}
            className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">My Orders</p>
              <p className="text-sm text-gray-500">View order history</p>
            </div>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <LogOut className="h-6 w-6" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">Logout</p>
              <p className="text-sm text-gray-500">Sign out of your account</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
