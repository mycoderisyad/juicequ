/**
 * Cashier Reports Page.
 * Daily reports and sales analytics.
 */
"use client";

import { useState, useEffect } from "react";
import { 
  Calendar,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  RotateCcw,
  Banknote,
  CreditCard,
  Smartphone,
  Trophy
} from "lucide-react";
import { reportsApi } from "@/lib/api/index";
import type { DailyReport, SalesSummary } from "@/lib/api/cashier";

type PeriodFilter = "today" | "week" | "month";

export default function CashierReportsPage() {
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [popularItems, setPopularItems] = useState<Array<{ id: string; name: string; quantity: number; revenue: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("today");

  const fetchReports = async () => {
    try {
      setError(null);
      const [daily, summaryData, popular] = await Promise.all([
        reportsApi.getDaily(selectedDate),
        reportsApi.getSummary(periodFilter),
        reportsApi.getPopularItems(10),
      ]);
      setDailyReport(daily);
      setSummary(summaryData);
      setPopularItems(popular.items);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError("Gagal memuat laporan");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedDate, periodFilter]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReports();
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
        return <Banknote className="h-5 w-5 text-green-600" />;
      case "card":
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      case "qris":
      case "e-wallet":
        return <Smartphone className="h-5 w-5 text-purple-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-600" />;
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

  const getPeriodLabel = (period: PeriodFilter) => {
    const labels: Record<PeriodFilter, string> = {
      today: "Hari Ini",
      week: "Minggu Ini",
      month: "Bulan Ini",
    };
    return labels[period];
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600" />
          <p className="mt-2 text-gray-500">Memuat laporan...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
          <p className="text-gray-500">Analisis penjualan dan performa</p>
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

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Date Picker */}
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Period Filter */}
        <div className="flex rounded-lg border border-gray-300 bg-white p-1">
          {(["today", "week", "month"] as PeriodFilter[]).map((period) => (
            <button
              key={period}
              onClick={() => setPeriodFilter(period)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                periodFilter === period
                  ? "bg-green-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {getPeriodLabel(period)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-green-100 p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Penjualan</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(summary?.sales.total || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-100 p-3">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Jumlah Transaksi</p>
              <p className="text-xl font-bold text-gray-900">
                {summary?.sales.count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-purple-100 p-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rata-rata Transaksi</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(summary?.sales.average || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-red-100 p-3">
              <RotateCcw className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Refund</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(summary?.refunds.total || 0)}
              </p>
              <p className="text-xs text-gray-400">{summary?.refunds.count || 0} transaksi</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Methods */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Metode Pembayaran</h2>
          {dailyReport?.by_payment_method && Object.keys(dailyReport.by_payment_method).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(dailyReport.by_payment_method).map(([method, data]) => (
                <div key={method} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getPaymentIcon(method)}
                    <div>
                      <p className="font-medium text-gray-900">{getPaymentLabel(method)}</p>
                      <p className="text-sm text-gray-500">{data.count} transaksi</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(data.total)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-gray-500">Tidak ada data pembayaran</p>
          )}
        </div>

        {/* Popular Items */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Produk Terlaris
          </h2>
          {popularItems.length > 0 ? (
            <div className="space-y-3">
              {popularItems.slice(0, 5).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      index === 0 
                        ? "bg-yellow-100 text-yellow-700" 
                        : index === 1 
                        ? "bg-gray-200 text-gray-700" 
                        : index === 2 
                        ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.quantity} terjual</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(item.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-gray-500">Tidak ada data produk</p>
          )}
        </div>

        {/* Order Status Summary */}
        <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Ringkasan Order</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{summary?.orders.total || 0}</p>
              <p className="text-sm text-gray-500">Total Order</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{summary?.orders.completed || 0}</p>
              <p className="text-sm text-gray-500">Selesai</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{summary?.orders.pending || 0}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{summary?.orders.cancelled || 0}</p>
              <p className="text-sm text-gray-500">Dibatalkan</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions (from Daily Report) */}
        {dailyReport?.transactions && dailyReport.transactions.length > 0 && (
          <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Transaksi Terbaru ({selectedDate})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500">
                    <th className="px-4 py-2 font-medium">ID</th>
                    <th className="px-4 py-2 font-medium">Metode</th>
                    <th className="px-4 py-2 font-medium">Jumlah</th>
                    <th className="px-4 py-2 font-medium">Kasir</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {dailyReport.transactions.slice(0, 10).map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs">{tx.id.slice(0, 8)}...</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {getPaymentIcon(tx.payment_method)}
                          {getPaymentLabel(tx.payment_method)}
                        </div>
                      </td>
                      <td className="px-4 py-2 font-medium">{formatCurrency(tx.amount)}</td>
                      <td className="px-4 py-2">{tx.cashier_name}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          tx.refunded 
                            ? "bg-red-100 text-red-700" 
                            : "bg-green-100 text-green-700"
                        }`}>
                          {tx.refunded ? "Refund" : tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
