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
  RotateCcw
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
        return <Banknote className="h-4 w-4 text-green-600" />;
      case "card":
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "qris":
      case "e-wallet":
        return <Smartphone className="h-4 w-4 text-purple-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />;
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
    if (refunded) return "bg-red-100 text-red-800";
    switch (status) {
      case "completed":
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600" />
          <p className="mt-2 text-gray-500">Memuat data transaksi...</p>
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaksi</h1>
          <p className="text-gray-500">Riwayat pembayaran dan transaksi</p>
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

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Transaksi</p>
          <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Penjualan</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalAmount)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Refund</p>
          <p className="text-2xl font-bold text-red-600">{summary.refunded}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Payment Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
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
      <div className="rounded-xl bg-white shadow-sm">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            {searchQuery || paymentFilter !== "all" 
              ? "Tidak ada transaksi yang sesuai filter" 
              : "Belum ada transaksi"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-6 py-3 font-medium">ID Transaksi</th>
                  <th className="px-6 py-3 font-medium">Order</th>
                  <th className="px-6 py-3 font-medium">Metode</th>
                  <th className="px-6 py-3 font-medium">Jumlah</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Kasir</th>
                  <th className="px-6 py-3 font-medium">Waktu</th>
                  <th className="px-6 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="text-sm hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-gray-600">
                        {transaction.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {transaction.order_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getPaymentIcon(transaction.payment_method)}
                        <span>{getPaymentLabel(transaction.payment_method)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(transaction.status, transaction.refunded)}`}>
                        {transaction.refunded ? "Refund" : transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {transaction.cashier_name || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatTime(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewReceipt(transaction)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Lihat Struk"
                        >
                          <Receipt className="h-4 w-4" />
                        </button>
                        {!transaction.refunded && transaction.status === "completed" && (
                          <button
                            onClick={() => handleRefundClick(transaction)}
                            className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Detail Transaksi</h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID Transaksi</span>
                <span className="font-mono">{selectedTransaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Order ID</span>
                <span className="font-mono">{selectedTransaction.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Metode Pembayaran</span>
                <span>{getPaymentLabel(selectedTransaction.payment_method)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Jumlah</span>
                <span className="font-semibold">{formatCurrency(selectedTransaction.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Diterima</span>
                <span>{formatCurrency(selectedTransaction.amount_received)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Kembalian</span>
                <span>{formatCurrency(selectedTransaction.change)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Kasir</span>
                <span>{selectedTransaction.cashier_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Waktu</span>
                <span>{formatTime(selectedTransaction.created_at)}</span>
              </div>
              {selectedTransaction.notes && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Catatan</span>
                  <span>{selectedTransaction.notes}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowReceiptModal(false)}
              className="mt-6 w-full rounded-lg bg-gray-100 py-2 font-medium text-gray-700 hover:bg-gray-200"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-red-600">Proses Refund</h3>
              <button
                onClick={() => setShowRefundModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Anda akan melakukan refund untuk transaksi senilai{" "}
              <strong>{formatCurrency(selectedTransaction.amount)}</strong>
            </p>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Alasan Refund <span className="text-red-500">*</span>
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Masukkan alasan refund..."
                className="w-full rounded-lg border border-gray-300 p-3 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleRefundSubmit}
                disabled={!refundReason.trim() || processingRefund}
                className="flex-1 rounded-lg bg-red-600 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {processingRefund ? (
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
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
