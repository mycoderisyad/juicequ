/**
 * Cashier Dashboard Page.
 */
"use client";

import { useState } from "react";
import { 
  ClipboardList, 
  DollarSign, 
  Clock,
  TrendingUp,
  RefreshCw
} from "lucide-react";

// Mock data (akan diganti dengan API call)
const mockStats = {
  pendingOrders: 5,
  todaySales: 1250000,
  todayTransactions: 42,
  avgProcessingTime: "3.5 menit",
};

const mockRecentOrders = [
  { id: "ORD001", customer: "John D.", items: 3, total: 45000, status: "pending", time: "2 menit lalu" },
  { id: "ORD002", customer: "Sarah M.", items: 2, total: 32000, status: "preparing", time: "5 menit lalu" },
  { id: "ORD003", customer: "Mike R.", items: 1, total: 18000, status: "ready", time: "8 menit lalu" },
];

export default function CashierDashboardPage() {
  const [stats] = useState(mockStats);
  const [recentOrders] = useState(mockRecentOrders);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Kasir</h1>
          <p className="text-gray-500">Selamat datang kembali! 👋</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-yellow-100 p-3">
              <ClipboardList className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-green-100 p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Penjualan Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.todaySales)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Transaksi Hari Ini</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayTransactions}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-100 p-3">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rata-rata Proses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgProcessingTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Terbaru</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="pb-3 font-medium">Order ID</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Items</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Waktu</th>
                <th className="pb-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentOrders.map((order) => (
                <tr key={order.id} className="text-sm">
                  <td className="py-3 font-medium text-gray-900">{order.id}</td>
                  <td className="py-3 text-gray-700">{order.customer}</td>
                  <td className="py-3 text-gray-700">{order.items} item</td>
                  <td className="py-3 font-medium text-gray-900">
                    {formatCurrency(order.total)}
                  </td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{order.time}</td>
                  <td className="py-3">
                    <button className="text-blue-600 hover:text-blue-800">
                      Proses
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-center">
          <a href="/cashier/orders" className="text-sm text-blue-600 hover:text-blue-800">
            Lihat Semua Order →
          </a>
        </div>
      </div>
    </div>
  );
}
