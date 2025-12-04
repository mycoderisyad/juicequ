"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  Eye,
  Package,
  AlertCircle,
  X,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  ChefHat,
  Coffee
} from "lucide-react";
import { adminOrdersApi, type AdminOrder, type OrderStats } from "@/lib/api/admin";

const ORDER_STATUSES = [
  { value: "", label: "Semua Status", icon: Package },
  { value: "pending", label: "Pending", icon: Clock, color: "text-amber-600 bg-amber-50" },
  { value: "paid", label: "Paid", icon: CreditCard, color: "text-blue-600 bg-blue-50" },
  { value: "preparing", label: "Preparing", icon: ChefHat, color: "text-purple-600 bg-purple-50" },
  { value: "ready", label: "Ready", icon: Coffee, color: "text-cyan-600 bg-cyan-50" },
  { value: "completed", label: "Completed", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
  { value: "cancelled", label: "Cancelled", icon: XCircle, color: "text-rose-600 bg-rose-50" },
];

function getStatusConfig(status: string) {
  return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
}

function StatusBadge({ status }: { status: string }) {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.color || "text-stone-600 bg-stone-100"}`}>
      <Icon size={14} />
      {config.label}
    </span>
  );
}

function OrderDetailModal({
  isOpen,
  onClose,
  order,
  onStatusChange,
  isUpdating,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: AdminOrder | null;
  onStatusChange: (orderId: string, status: string) => void;
  isUpdating: boolean;
}) {
  if (!isOpen || !order) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-4xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-800">
              Order #{order.order_number}
            </h2>
            <p className="text-sm text-stone-500">{formatDate(order.created_at)}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors">
            <X size={18} className="text-stone-500" />
          </button>
        </div>

        {/* Status & Customer Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-stone-50 rounded-2xl p-4">
            <p className="text-xs text-stone-500 mb-2">Status</p>
            <StatusBadge status={order.status} />
          </div>
          <div className="bg-stone-50 rounded-2xl p-4">
            <p className="text-xs text-stone-500 mb-2">Customer</p>
            <p className="font-semibold text-stone-800">{order.customer_name}</p>
            {order.customer_phone && (
              <p className="text-sm text-stone-500">{order.customer_phone}</p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6">
          <h3 className="font-semibold text-stone-800 mb-3">Items</h3>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-stone-50 rounded-xl p-3">
                <div>
                  <p className="font-medium text-stone-800">{item.product_name}</p>
                  <p className="text-sm text-stone-500">
                    {item.size} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-stone-800">{formatCurrency(item.subtotal)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="bg-emerald-50 rounded-2xl p-4 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-stone-600">Subtotal</span>
            <span className="text-stone-800">{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-stone-600">Diskon</span>
              <span className="text-emerald-600">-{formatCurrency(order.discount)}</span>
            </div>
          )}
          {order.tax > 0 && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-stone-600">Pajak</span>
              <span className="text-stone-800">{formatCurrency(order.tax)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-emerald-200">
            <span className="text-stone-800">Total</span>
            <span className="text-emerald-700">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Notes */}
        {(order.customer_notes || order.internal_notes) && (
          <div className="mb-6 space-y-3">
            {order.customer_notes && (
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-xs text-amber-600 font-medium mb-1">Catatan Customer</p>
                <p className="text-sm text-stone-700">{order.customer_notes}</p>
              </div>
            )}
            {order.internal_notes && (
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-600 font-medium mb-1">Catatan Internal</p>
                <p className="text-sm text-stone-700">{order.internal_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Status Change Actions */}
        {order.status !== "completed" && order.status !== "cancelled" && (
          <div className="border-t border-stone-200 pt-4">
            <p className="text-sm font-medium text-stone-600 mb-3">Ubah Status</p>
            <div className="flex flex-wrap gap-2">
              {ORDER_STATUSES.filter(s => s.value && s.value !== order.status).map((status) => (
                <button
                  key={status.value}
                  onClick={() => onStatusChange(order.id, status.value)}
                  disabled={isUpdating}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${status.color} hover:opacity-80 disabled:opacity-50`}
                >
                  {isUpdating ? <Loader2 size={14} className="animate-spin" /> : status.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const [ordersRes, statsRes] = await Promise.all([
        adminOrdersApi.getAll({
          status: statusFilter || undefined,
          search: searchQuery || undefined,
        }),
        adminOrdersApi.getStats(),
      ]);
      setOrders(ordersRes.orders || []);
      setStats(statsRes);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleViewOrder = (order: AdminOrder) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      setIsUpdating(true);
      await adminOrdersApi.updateStatus(orderId, status);
      await fetchOrders();
      // Update selected order if it's open
      if (selectedOrder?.id === orderId) {
        const updatedOrder = orders.find(o => o.id === orderId);
        if (updatedOrder) {
          setSelectedOrder({ ...updatedOrder, status });
        }
      }
      setIsDetailOpen(false);
    } catch (err) {
      console.error("Failed to update status:", err);
      setError("Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-800">Orders</h1>
          <p className="text-stone-500 text-sm">Kelola semua pesanan</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {ORDER_STATUSES.filter(s => s.value).map((status) => {
            const count = stats.by_status[status.value] || 0;
            const Icon = status.icon;
            return (
              <button
                key={status.value}
                onClick={() => setStatusFilter(statusFilter === status.value ? "" : status.value)}
                className={`p-4 rounded-2xl border transition-all ${
                  statusFilter === status.value 
                    ? "border-emerald-500 bg-emerald-50 shadow-sm" 
                    : "border-stone-200 bg-white hover:border-stone-300"
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${status.color} flex items-center justify-center mb-2`}>
                  <Icon size={16} />
                </div>
                <p className="text-2xl font-bold text-stone-800">{count}</p>
                <p className="text-xs text-stone-500">{status.label}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-rose-600 border border-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Cari order number atau nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-stone-200 text-stone-600 text-sm rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
        >
          {ORDER_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-4">
              <Package className="h-10 w-10 text-stone-300" />
            </div>
            <h3 className="text-lg font-serif font-bold text-stone-800">Belum ada order</h3>
            <p className="text-stone-500">Order akan muncul di sini</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-wider">Waktu</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-stone-400 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-stone-800">#{order.order_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-stone-800">{order.customer_name}</p>
                      {order.customer_phone && (
                        <p className="text-sm text-stone-400">{order.customer_phone}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-stone-600">{order.items_count} item</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-stone-800">{formatCurrency(order.total)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-stone-500 text-sm">{formatDate(order.created_at)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleViewOrder(order)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                        >
                          <Eye size={16} />
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

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        order={selectedOrder}
        onStatusChange={handleStatusChange}
        isUpdating={isUpdating}
      />
    </div>
  );
}
