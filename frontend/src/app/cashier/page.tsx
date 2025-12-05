/**
 * Cashier Dashboard Page - Modern Design.
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
  AlertCircle,
  ArrowUpRight,
  ShoppingCart,
  ArrowRight,
  CheckCircle,
  ChefHat,
  XCircle,
  Eye
} from "lucide-react";
import Link from "next/link";
import { cashierOrdersApi, transactionsApi } from "@/lib/api/index";
import type { Order } from "@/lib/api/customer";

// Modern Stat Card Component
function StatCard({
  label,
  value,
  trend,
  trendUp,
  icon: Icon,
  colorClass = "text-stone-800"
}: {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ElementType;
  colorClass?: string;
}) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-3xl sm:rounded-4xl shadow-sm border border-stone-100 hover:border-emerald-200 transition-colors group">
      <div className="flex justify-between items-start mb-2 sm:mb-4">
        <p className="text-stone-400 text-xs sm:text-sm font-medium">{label}</p>
        {Icon && <Icon className="text-stone-300 group-hover:text-emerald-500 transition-colors" size={20} />}
      </div>
      <div className="flex items-end justify-between gap-2">
        <h3 className={`text-xl sm:text-2xl font-serif font-bold ${colorClass}`}>{value}</h3>
        {trend && (
          <span className={`text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${
            trendUp ? "bg-emerald-50 text-emerald-600" : "bg-stone-100 text-stone-600"
          }`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export default function CashierDashboardPage() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [todayStats, setTodayStats] = useState({
    pendingCount: 0,
    todaySales: 0,
    todayTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      
      // Fetch pending orders and transactions
      const [pendingData, transactionsData] = await Promise.all([
        cashierOrdersApi.getPending(),
        transactionsApi.getAll({ limit: 100 }),
      ]);
      
      setPendingOrders(pendingData.orders);
      
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
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "paid":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "preparing":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "ready":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "bg-stone-100 text-stone-800 border-stone-200";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} mnt lalu`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} jam lalu`;
    return date.toLocaleDateString("id-ID");
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: Record<string, string> = {
      pending: "paid",
      paid: "preparing",
      preparing: "ready",
      ready: "completed",
    };
    return statusFlow[currentStatus] || null;
  };

  const getNextStatusLabel = (currentStatus: string): string | null => {
    const labels: Record<string, string> = {
      pending: "Tandai Dibayar",
      paid: "Mulai Proses",
      preparing: "Siap Diambil",
      ready: "Selesai",
    };
    return labels[currentStatus] || "Proses";
  };

  const handleProcessOrder = async (orderId: string, currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return;

    try {
      setProcessingOrderId(orderId);
      await cashierOrdersApi.updateStatus(orderId, nextStatus);
      await fetchData(); // Refresh data after update
    } catch (err) {
      console.error("Failed to update order status:", err);
      alert("Gagal memproses order. Silakan coba lagi.");
    } finally {
      setProcessingOrderId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-2 text-stone-500">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
          <h2 className="mt-4 text-lg font-semibold text-stone-900">{error}</h2>
          <button
            onClick={handleRefresh}
            className="mt-4 rounded-full bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Actions */}
      <div className="flex justify-end">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-600 shadow-sm border border-stone-200 hover:bg-stone-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Revenue Card (Dark/Featured) */}
        <div className="col-span-2 sm:col-span-1 bg-emerald-900 text-white p-4 sm:p-6 rounded-3xl sm:rounded-4xl shadow-lg shadow-emerald-900/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <p className="text-emerald-200 text-xs sm:text-sm font-medium">Penjualan Hari Ini</p>
              <div className="p-1.5 bg-white/10 rounded-full rotate-45 group-hover:rotate-0 transition-transform">
                <ArrowUpRight size={14} />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold mb-1">{formatCurrency(todayStats.todaySales)}</h3>
            <p className="text-[10px] sm:text-xs text-emerald-300">Total pendapatan shift ini</p>
          </div>
        </div>

        <StatCard
          label="Order Pending"
          value={todayStats.pendingCount}
          trend={todayStats.pendingCount > 0 ? "Perlu diproses" : "Aman"}
          trendUp={false}
          icon={ClipboardList}
        />

        <StatCard
          label="Transaksi"
          value={todayStats.todayTransactions}
          trend="Hari ini"
          trendUp={true}
          icon={TrendingUp}
        />

        <StatCard
          label="Rata-rata Waktu"
          value="-"
          trend="Menit / Order"
          trendUp={true}
          icon={Clock}
        />
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-stone-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-serif font-bold text-stone-900">Order Pending</h2>
            <p className="text-stone-500 text-sm">Pesanan yang perlu segera diproses</p>
          </div>
          <Link 
            href="/cashier/orders" 
            className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700"
          >
            Lihat Semua <ArrowRight size={16} />
          </Link>
        </div>
        
        {pendingOrders.length === 0 ? (
          <div className="py-12 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200">
            <ClipboardList className="mx-auto h-12 w-12 text-stone-300 mb-3" />
            <p className="text-stone-500 font-medium">Tidak ada order yang pending</p>
            <p className="text-stone-400 text-sm">Semua pesanan telah diproses</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-stone-100 text-left text-xs font-medium text-stone-500 uppercase tracking-wider">
                  <th className="pb-3 pl-4">Order ID</th>
                  <th className="pb-3">Items</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Waktu</th>
                  <th className="pb-3 pr-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {pendingOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="text-sm hover:bg-stone-50 transition-colors group">
                    <td className="py-4 pl-4 font-medium text-stone-900 font-mono">{order.order_number}</td>
                    <td className="py-4 text-stone-600">
                      <span className="font-medium text-stone-900">{order.items?.length || 0}</span> item
                    </td>
                    <td className="py-4 font-bold text-stone-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 text-stone-500 flex items-center gap-1">
                      <Clock size={14} />
                      {formatTime(order.created_at)}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <div className="flex justify-end gap-2">
                         <Link 
                          href={`/cashier/orders/${order.id}`}
                          className="inline-flex items-center justify-center rounded-full bg-stone-100 p-1.5 text-stone-400 hover:text-emerald-600 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleProcessOrder(order.id.toString(), order.status)}
                          disabled={processingOrderId === order.id.toString()}
                          className="inline-flex items-center justify-center rounded-full bg-stone-900 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                        >
                          {processingOrderId === order.id.toString() ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            getNextStatusLabel(order.status)
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
