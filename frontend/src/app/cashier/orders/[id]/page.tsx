"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChefHat,
  Banknote,
  Smartphone,
  CreditCard,
  Printer,
  Receipt,
  Loader2,
  AlertCircle
} from "lucide-react";
import { cashierOrdersApi } from "@/lib/api/index";
import type { Order } from "@/lib/api/customer";

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "bg-amber-100 text-amber-800 border-amber-200", icon: <Clock className="h-4 w-4" />, label: "Pending" },
  paid: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: <CheckCircle className="h-4 w-4" />, label: "Paid" },
  preparing: { color: "bg-orange-100 text-orange-800 border-orange-200", icon: <ChefHat className="h-4 w-4" />, label: "Preparing" },
  ready: { color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: <CheckCircle className="h-4 w-4" />, label: "Ready" },
  completed: { color: "bg-stone-100 text-stone-800 border-stone-200", icon: <CheckCircle className="h-4 w-4" />, label: "Completed" },
  cancelled: { color: "bg-rose-100 text-rose-800 border-rose-200", icon: <XCircle className="h-4 w-4" />, label: "Cancelled" },
};

const paymentIcons: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-5 w-5 text-emerald-600" />,
  qris: <Smartphone className="h-5 w-5 text-purple-600" />,
  transfer: <CreditCard className="h-5 w-5 text-blue-600" />,
};

export default function CashierOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const orderId = params?.id as string;

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cashierOrdersApi.getById(orderId);
      setOrder(data);
    } catch {
      setError("Order tidak ditemukan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

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
      ready: "Selesai Order",
    };
    return labels[currentStatus] || null;
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setProcessing(true);
      await cashierOrdersApi.updateStatus(orderId, newStatus);
      await fetchOrder();
    } catch {
      alert("Gagal mengupdate status order");
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-2 text-stone-500">Memuat detail order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold text-stone-900 mb-2">Order Tidak Ditemukan</h1>
        <p className="text-stone-500 mb-6">{error}</p>
        <Link 
          href="/cashier/orders"
          className="rounded-full bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700 transition-colors"
        >
          Kembali ke Daftar Order
        </Link>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;
  const displayOrderId = order.order_number || order.id;
  const nextStatus = getNextStatus(order.status);

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <Link
        href="/cashier/orders"
        className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-stone-900 mb-6 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Daftar Order
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-serif font-bold text-stone-900">
                    Order #{displayOrderId}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${status.color} flex items-center gap-1.5`}>
                    {status.icon}
                    {status.label}
                  </span>
                </div>
                <p className="text-sm text-stone-500">
                  Dibuat pada {formatDate(order.created_at)}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button className="p-2 rounded-full border border-stone-200 text-stone-500 hover:bg-stone-50 hover:text-stone-900 transition-colors" title="Cetak Struk">
                  <Printer className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Items Card */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100">
            <h2 className="text-lg font-serif font-bold text-stone-900 mb-4 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-stone-400" />
              Item Pesanan
            </h2>
            <div className="divide-y divide-stone-100">
              {order.items.map((item, index) => {
                const itemName = item.name || item.product_name || "Unknown Product";
                const itemPrice = item.price || item.unit_price || 0;
                const itemSubtotal = item.subtotal || (itemPrice * item.quantity);
                
                return (
                  <div key={index} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between group">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-xl group-hover:bg-emerald-50 group-hover:scale-110 transition-all duration-300">
                        🥤
                      </div>
                      <div>
                        <p className="font-bold text-stone-900">{itemName}</p>
                        <div className="flex items-center gap-2 text-sm text-stone-500 mt-0.5">
                          <span className="font-medium">{item.quantity}x</span>
                          <span>{formatCurrency(itemPrice)}</span>
                          {item.size && (
                            <>
                              <span className="w-1 h-1 bg-stone-300 rounded-full"></span>
                              <span className="capitalize">{item.size}</span>
                            </>
                          )}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-stone-400 mt-1 italic">
                            "{item.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="font-bold text-stone-900">
                      {formatCurrency(itemSubtotal)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes Card */}
          {(order.notes || order.customer_notes) && (
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100">
              <h2 className="text-lg font-serif font-bold text-stone-900 mb-2">Catatan</h2>
              <p className="text-stone-600 bg-stone-50 p-4 rounded-xl text-sm italic">
                {order.notes || order.customer_notes}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Actions Card */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100 sticky top-6">
            <h2 className="text-lg font-serif font-bold text-stone-900 mb-4">Aksi</h2>
            
            {nextStatus ? (
              <button
                onClick={() => handleUpdateStatus(nextStatus)}
                disabled={processing}
                className="w-full rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-600/20 mb-3 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  getNextStatusLabel(order.status)
                )}
              </button>
            ) : (
              <div className="bg-stone-50 rounded-xl p-3 text-center text-sm text-stone-500 mb-3">
                Order Selesai
              </div>
            )}

            <button 
              className="w-full rounded-xl border border-stone-200 py-3 font-medium text-stone-600 hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Cetak Struk
            </button>

            {/* Summary */}
            <div className="mt-8 pt-6 border-t border-dashed border-stone-200 space-y-3">
              <div className="flex justify-between text-stone-500 text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-500 text-sm">
                <span>Pajak</span>
                <span>{formatCurrency(order.tax ?? 0)}</span>
              </div>
              {order.discount && order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 text-sm font-medium">
                  <span>Diskon</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-stone-900 pt-2">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>

            {/* Payment Info */}
            {order.payment_method && (
              <div className="mt-6 pt-6 border-t border-dashed border-stone-200">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Metode Pembayaran</p>
                <div className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl">
                  {paymentIcons[order.payment_method] || <CreditCard className="h-5 w-5 text-stone-400" />}
                  <span className="capitalize font-medium text-stone-900">{order.payment_method}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

