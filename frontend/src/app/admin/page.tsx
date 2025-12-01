/**
 * Admin Dashboard Page.
 */
"use client";

import { useState } from "react";
import { 
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

// Mock data
const mockDashboard = {
  users: { total: 150, active: 142, growth: 12 },
  products: { total: 24, available: 22 },
  orders: { total: 856, today: 23, pending: 8 },
  revenue: { today: 2450000, total: 45600000, growth: 8.5 },
};

const mockTopProducts = [
  { name: "Berry Blast", sold: 156, revenue: 1326000 },
  { name: "Green Goddess", sold: 134, revenue: 1206000 },
  { name: "Tropical Paradise", sold: 98, revenue: 857500 },
  { name: "Protein Power", sold: 87, revenue: 870000 },
];

const mockRecentActivity = [
  { type: "order", message: "Order baru dari John D.", time: "2 menit lalu" },
  { type: "user", message: "User baru terdaftar: sarah@email.com", time: "15 menit lalu" },
  { type: "product", message: "Stok 'Acai Bowl' hampir habis", time: "1 jam lalu" },
  { type: "order", message: "Order #ORD-123 selesai", time: "2 jam lalu" },
];

export default function AdminDashboardPage() {
  const [dashboard] = useState(mockDashboard);
  const [topProducts] = useState(mockTopProducts);
  const [recentActivity] = useState(mockRecentActivity);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500">Overview bisnis JuiceQu</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Users */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-100 p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp className="h-4 w-4" />
              +{dashboard.users.growth}%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{dashboard.users.total}</p>
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="mt-1 text-xs text-gray-400">{dashboard.users.active} aktif</p>
        </div>

        {/* Products */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-purple-100 p-3">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{dashboard.products.total}</p>
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="mt-1 text-xs text-gray-400">{dashboard.products.available} tersedia</p>
        </div>

        {/* Orders */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-orange-100 p-3">
              <ShoppingCart className="h-6 w-6 text-orange-600" />
            </div>
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
              {dashboard.orders.pending} pending
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">{dashboard.orders.total}</p>
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="mt-1 text-xs text-gray-400">{dashboard.orders.today} hari ini</p>
        </div>

        {/* Revenue */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-green-100 p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-green-600">
              <TrendingUp className="h-4 w-4" />
              +{dashboard.revenue.growth}%
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold text-gray-900">
            {formatCurrency(dashboard.revenue.total)}
          </p>
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="mt-1 text-xs text-gray-400">
            {formatCurrency(dashboard.revenue.today)} hari ini
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Produk Terlaris</h2>
            <Link
              href="/admin/analytics"
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              Lihat Detail
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center gap-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.sold} terjual</p>
                </div>
                <p className="font-medium text-gray-900">
                  {formatCurrency(product.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Aktivitas Terbaru</h2>
          
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`mt-1 h-2 w-2 rounded-full ${
                  activity.type === "order" ? "bg-green-500" :
                  activity.type === "user" ? "bg-blue-500" : "bg-yellow-500"
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/products"
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
        >
          <Package className="h-8 w-8 text-purple-600" />
          <div>
            <p className="font-medium text-gray-900">Kelola Produk</p>
            <p className="text-sm text-gray-500">Tambah atau edit produk</p>
          </div>
        </Link>
        
        <Link
          href="/admin/users"
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
        >
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <p className="font-medium text-gray-900">Kelola Users</p>
            <p className="text-sm text-gray-500">Atur role pengguna</p>
          </div>
        </Link>
        
        <Link
          href="/admin/analytics"
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
        >
          <TrendingUp className="h-8 w-8 text-green-600" />
          <div>
            <p className="font-medium text-gray-900">Lihat Analytics</p>
            <p className="text-sm text-gray-500">Laporan penjualan</p>
          </div>
        </Link>
        
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
        >
          <Package className="h-8 w-8 text-gray-600" />
          <div>
            <p className="font-medium text-gray-900">Pengaturan</p>
            <p className="text-sm text-gray-500">Konfigurasi toko</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
