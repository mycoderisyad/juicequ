/**
 * Cashier Transactions Page.
 * View and manage payment transactions.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  RotateCcw,
  Wallet
} from "lucide-react";
import { transactionsApi } from "@/lib/api/index";
import type { Transaction } from "@/lib/api/cashier";

type PaymentFilter = "all" | "cash" | "card" | "qris" | "e-wallet";

export default function CashierTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [processingRefund, setProcessingRefund] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setError(null);
      const params: { payment_method?: string; limit?: number } = { limit: 100 };
      if (paymentFilter !== "all") {
        params.payment_method = paymentFilter;
      }
      const data = await transactionsApi.getAll(params);
      setTransactions(data.transactions);
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setError("Gagal memuat data transaksi");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [paymentFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTransactions();
  };

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
  };

  const handleRefundClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setRefundReason("");
    setShowRefundModal(true);
  };

  const handleRefundSubmit = async () => {
    if (!selectedTransaction || !refundReason.trim()) return;
    
    try {
      setProcessingRefund(true);
      await transactionsApi.refund(selectedTransaction.id, refundReason);
      setShowRefundModal(false);
      await fetchTransactions();
    } catch (err) {
      console.error("Failed to process refund:", err);
      alert("Gagal memproses refund");
    } finally {
      setProcessingRefund(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case "cash":
        return <Banknote className="h-4 w-4 text-emerald-600" />;
      case "card":
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "qris":
        return <Smartphone className="h-4 w-4 text-purple-600" />;
      case "e-wallet":
        return <Wallet className="h-4 w-4 text-orange-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-stone-600" />;
    }
  };

  const getPaymentLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Tunai",
      card: "Kartu",
      qris: "QRIS",
      "e-wallet": "E-Wallet",
    };
    return labels[method.toLowerCase()] || method;
  };

  const getStatusColor = (status: string, refunded: boolean | undefined) => {
    if (refunded) return "bg-rose-100 text-rose-800 border-rose-200";
    switch (status) {
      case "completed":
      case "paid":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "failed":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-stone-100 text-stone-800 border-stone-200";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = 
      transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.cashier_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Calculate summary
  const summary = {
    total: filteredTransactions.length,
    totalAmount: filteredTransactions
      .filter(t => !t.refunded && (t.status === "completed" || t.status === "paid"))
      .reduce((sum, t) => sum + t.amount, 0),
    refunded: filteredTransactions.filter(t => t.refunded).length,
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-2 text-stone-500">Memuat data transaksi...</p>
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
          <h1 className="text-2xl font-serif font-bold text-stone-900">Transaksi</h1>
          <p className="text-stone-500 text-sm">Riwayat pembayaran dan transaksi</p>
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

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-stone-100">
          <p className="text-xs font-medium text-stone-400 mb-1">Total Transaksi</p>
          <p className="text-2xl font-serif font-bold text-stone-900">{summary.total}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-stone-100">
          <p className="text-xs font-medium text-stone-400 mb-1">Total Penjualan</p>
          <p className="text-2xl font-serif font-bold text-emerald-600">{formatCurrency(summary.totalAmount)}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm border border-stone-100">
          <p className="text-xs font-medium text-stone-400 mb-1">Refund</p>
          <p className="text-2xl font-serif font-bold text-rose-600">{summary.refunded}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-stone-200 py-2 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-stone-50"
          />
        </div>

        {/* Payment Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-stone-400" />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
            className="rounded-full border border-stone-200 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-stone-50 cursor-pointer"
          >
            <option value="all">Semua Metode</option>
            <option value="cash">Tunai</option>
            <option value="card">Kartu</option>
            <option value="qris">QRIS</option>
            <option value="e-wallet">E-Wallet</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl sm:rounded-[2rem] bg-white shadow-sm border border-stone-200 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-stone-500">
            {searchQuery || paymentFilter !== "all" 
              ? "Tidak ada transaksi yang sesuai filter" 
              : "Belum ada transaksi"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-stone-100">
                <tr className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  <th className="px-6 py-4">ID Transaksi</th>
                  <th className="px-6 py-4">Order</th>
                  <th className="px-6 py-4">Metode</th>
                  <th className="px-6 py-4">Jumlah</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Kasir</th>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="text-sm hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-stone-600 bg-stone-100 px-2 py-1 rounded">
                        {transaction.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-stone-900">
                      {transaction.order_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-stone-600">
                        {getPaymentIcon(transaction.payment_method)}
                        <span>{getPaymentLabel(transaction.payment_method)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-stone-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${getStatusColor(transaction.status, transaction.refunded)}`}>
                        {transaction.refunded ? "Refund" : transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stone-700">
                      {transaction.cashier_name || "-"}
                    </td>
                    <td className="px-6 py-4 text-stone-500">
                      {formatTime(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewReceipt(transaction)}
                          className="rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
                          title="Lihat Struk"
                        >
                          <Receipt className="h-4 w-4" />
                        </button>
                        {!transaction.refunded && transaction.status === "completed" && (
                          <button
                            onClick={() => handleRefundClick(transaction)}
                            className="rounded-full p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Refund"
                          >
                            <RotateCcw className="h-4 w-4" />
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

      {/* Receipt Modal */}
      {showReceiptModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-serif font-bold text-stone-900">Detail Transaksi</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-dashed border-stone-200 pb-3">
                <span className="text-stone-500">ID Transaksi</span>
                <span className="font-mono font-medium">{selectedTransaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Order ID</span>
                <span className="font-mono">{selectedTransaction.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Metode Pembayaran</span>
                <span className="font-medium">{getPaymentLabel(selectedTransaction.payment_method)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Jumlah</span>
                <span className="font-bold text-emerald-600">{formatCurrency(selectedTransaction.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Diterima</span>
                <span>{formatCurrency(selectedTransaction.amount_received)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Kembalian</span>
                <span>{formatCurrency(selectedTransaction.change)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Kasir</span>
                <span>{selectedTransaction.cashier_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Waktu</span>
                <span>{formatTime(selectedTransaction.created_at)}</span>
              </div>
              {selectedTransaction.notes && (
                <div className="flex justify-between bg-stone-50 p-2 rounded-lg">
                  <span className="text-stone-500">Catatan</span>
                  <span className="text-stone-800">{selectedTransaction.notes}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowReceiptModal(false)}
              className="mt-6 w-full rounded-xl bg-stone-100 py-3 font-bold text-stone-700 hover:bg-stone-200 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-serif font-bold text-rose-600">Proses Refund</h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>
            <p className="mb-4 text-sm text-stone-600">
              Anda akan melakukan refund untuk transaksi senilai{" "}
              <strong className="text-stone-900">{formatCurrency(selectedTransaction.amount)}</strong>
            </p>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Alasan Refund <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Masukkan alasan refund..."
                className="w-full rounded-xl border border-stone-300 p-3 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 bg-stone-50"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 rounded-xl border border-stone-300 py-2.5 font-bold text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleRefundSubmit}
                disabled={!refundReason.trim() || processingRefund}
                className="flex-1 rounded-xl bg-rose-600 py-2.5 font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {processingRefund ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Proses Refund"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
