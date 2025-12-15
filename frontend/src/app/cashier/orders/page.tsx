/**
 * Cashier Orders Page.
 * Manage and process customer orders.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  ChefHat
} from "lucide-react";
import { cashierOrdersApi } from "@/lib/api/index";
import type { Order } from "@/lib/api/customer";

type OrderStatus = "all" | "pending" | "paid" | "preparing" | "ready" | "completed" | "cancelled";

export default function CashierOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const params: { status?: string; limit?: number } = { limit: 100 };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const data = await cashierOrdersApi.getAll(params);
      setOrders(data.orders);
    } catch {
      setError("Gagal memuat data order");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      await cashierOrdersApi.updateStatus(orderId, newStatus);
      await fetchOrders();
    } catch {
      alert("Gagal mengubah status order");
    } finally {
      setUpdatingOrderId(null);
    }
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
      case "completed":
        return "bg-stone-100 text-stone-800 border-stone-200";
      case "cancelled":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-stone-100 text-stone-800 border-stone-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-3 w-3" />;
      case "paid":
        return <CheckCircle className="h-3 w-3" />;
      case "preparing":
        return <ChefHat className="h-3 w-3" />;
      case "ready":
        return <CheckCircle className="h-3 w-3" />;
      case "completed":
        return <CheckCircle className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
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
    return labels[currentStatus] || null;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toString().includes(searchQuery);
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-2 text-stone-500">Memuat data order...</p>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900">Daftar Order</h1>
          <p className="text-stone-500 text-sm">Kelola dan proses pesanan pelanggan</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-600 shadow-sm border border-stone-200 hover:bg-stone-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Cari order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-stone-200 py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-stone-50"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-stone-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus)}
            className="rounded-full border border-stone-200 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-stone-50 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Dibayar</option>
            <option value="preparing">Diproses</option>
            <option value="ready">Siap</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl sm:rounded-[2rem] bg-white shadow-sm border border-stone-200 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-stone-500">
            {searchQuery || statusFilter !== "all" 
              ? "Tidak ada order yang sesuai filter" 
              : "Belum ada order"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="text-sm hover:bg-stone-50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-medium text-stone-900">
                        {order.order_number || `#${order.id}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stone-600">
                      {order.items?.length || 0} item
                    </td>
                    <td className="px-6 py-4 font-bold text-stone-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stone-500">
                      {formatTime(order.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/cashier/orders/${order.id}`}
                          className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-emerald-600 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {getNextStatus(order.status) && (
                          <button
                            onClick={() => handleUpdateStatus(order.id.toString(), getNextStatus(order.status)!)}
                            disabled={updatingOrderId === order.id.toString()}
                            className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            {updatingOrderId === order.id.toString() ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              getNextStatusLabel(order.status)
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="text-center text-xs text-stone-400">
        Menampilkan {filteredOrders.length} dari {orders.length} order
      </div>
    </div>
  );
}
