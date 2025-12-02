/**
 * Cashier Dashboard Page.
 */
"use client";

import { useState, useEffect } from "react";
import { 
  ClipboardList, 
  DollarSign, 
  Clock,
  TrendingUp,
  RefreshCw,
  Loader2,
  AlertCircle
} from "lucide-react";
import { cashierOrdersApi, transactionsApi } from "@/lib/api/index";

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface CashierOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  items: OrderItem[];
  created_at: string;
}

export default function CashierDashboardPage() {
  const [pendingOrders, setPendingOrders] = useState<CashierOrder[]>([]);
  const [todayStats, setTodayStats] = useState({
    pendingCount: 0,
    todaySales: 0,
    todayTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      
      // Fetch pending orders and transactions
      const [pendingData, transactionsData] = await Promise.all([
        cashierOrdersApi.getPending(),
        transactionsApi.getAll({ limit: 100 }),
      ]);
      
      setPendingOrders(pendingData.orders as CashierOrder[]);
      
      // Calculate today's stats
      const todaySales = transactionsData.transactions
        .filter(t => t.status === "completed" || t.status === "paid")
        .reduce((sum, t) => sum + t.amount, 0);
      
      setTodayStats({
        pendingCount: pendingData.total,
        todaySales: todaySales,
        todayTransactions: transactionsData.transactions.length,
      });
    } catch (err) {
      console.error("Failed to load cashier data:", err);
      setError("Gagal memuat data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
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
      case "paid":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-orange-100 text-orange-800";
      case "ready":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} jam lalu`;
    return date.toLocaleDateString("id-ID");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600" />
          <p className="mt-2 text-gray-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">{error}</h2>
          <button
            onClick={handleRefresh}
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

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
              <p className="text-2xl font-bold text-gray-900">{todayStats.pendingCount}</p>
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
                {formatCurrency(todayStats.todaySales)}
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
              <p className="text-2xl font-bold text-gray-900">{todayStats.todayTransactions}</p>
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
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Pending</h2>
        
        {pendingOrders.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            Tidak ada order yang pending
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="pb-3 font-medium">Order ID</th>
                  <th className="pb-3 font-medium">Items</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Waktu</th>
                  <th className="pb-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pendingOrders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="text-sm">
                    <td className="py-3 font-medium text-gray-900">{order.order_number}</td>
                    <td className="py-3 text-gray-700">{order.items?.length || 0} item</td>
                    <td className="py-3 font-medium text-gray-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">{formatTime(order.created_at)}</td>
                    <td className="py-3">
                      <a 
                        href={`/cashier/orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Proses
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-4 text-center">
          <a href="/cashier/orders" className="text-sm text-blue-600 hover:text-blue-800">
            Lihat Semua Order →
          </a>
        </div>
      </div>
    </div>
  );
}
