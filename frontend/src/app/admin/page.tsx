/**
 * Admin Dashboard Page.
 */
"use client";

import { useState, useEffect } from "react";
import { 
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { analyticsApi, type DashboardData } from "@/lib/api/index";

interface TopProduct {
  id: string;
  name: string;
  quantity_sold: number;
  revenue: number;
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch dashboard and product analytics in parallel
        const [dashboardData, productsData] = await Promise.all([
          analyticsApi.getDashboard(),
          analyticsApi.getProducts(4), // Get top 4 products
        ]);
        
        setDashboard(dashboardData);
        setTopProducts(productsData.top_products || []);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError("Gagal memuat data dashboard");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600" />
          <p className="mt-2 text-gray-500">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            {error || "Gagal memuat data"}
          </h2>
          <p className="mt-2 text-gray-500">Silakan coba lagi nanti</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }

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
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.quantity_sold} terjual</p>
                  </div>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">Belum ada data penjualan</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Ringkasan Hari Ini</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-gray-700">Pendapatan</span>
              </div>
              <span className="font-semibold text-green-700">
                {formatCurrency(dashboard.revenue.today)}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700">Transaksi</span>
              </div>
              <span className="font-semibold text-blue-700">
                {dashboard.revenue.transactions_today} transaksi
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-orange-600" />
                <span className="text-gray-700">Order Baru</span>
              </div>
              <span className="font-semibold text-orange-700">
                {dashboard.orders.today} order
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
                <span className="text-gray-700">Pending</span>
              </div>
              <span className="font-semibold text-yellow-700">
                {dashboard.orders.pending} order
              </span>
            </div>
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
