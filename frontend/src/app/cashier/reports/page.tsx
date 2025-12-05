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
  Trophy,
  Wallet
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
        return <Banknote className="h-5 w-5 text-emerald-600" />;
      case "card":
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      case "qris":
        return <Smartphone className="h-5 w-5 text-purple-600" />;
      case "e-wallet":
        return <Wallet className="h-5 w-5 text-orange-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-stone-600" />;
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
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-2 text-stone-500">Memuat laporan...</p>
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
          <h1 className="text-2xl font-serif font-bold text-stone-900">Laporan</h1>
          <p className="text-stone-500 text-sm">Analisis penjualan dan performa</p>
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
        {/* Date Picker */}
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-stone-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-stone-200 px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-stone-50 text-stone-800"
          />
        </div>

        {/* Period Filter */}
        <div className="flex rounded-full border border-stone-200 bg-stone-50 p-1">
          {(["today", "week", "month"] as PeriodFilter[]).map((period) => (
            <button
              key={period}
              onClick={() => setPeriodFilter(period)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                periodFilter === period
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              {getPeriodLabel(period)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100 group hover:border-emerald-200 transition-colors">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Penjualan</p>
              <p className="text-xl font-serif font-bold text-stone-900">
                {formatCurrency(summary?.sales.total || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100 group hover:border-blue-200 transition-colors">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600 group-hover:bg-blue-100 transition-colors">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Transaksi</p>
              <p className="text-xl font-serif font-bold text-stone-900">
                {summary?.sales.count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100 group hover:border-purple-200 transition-colors">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-purple-50 p-3 text-purple-600 group-hover:bg-purple-100 transition-colors">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Rata-rata</p>
              <p className="text-xl font-serif font-bold text-stone-900">
                {formatCurrency(summary?.sales.average || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm border border-stone-100 group hover:border-rose-200 transition-colors">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-600 group-hover:bg-rose-100 transition-colors">
              <RotateCcw className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Refund</p>
              <p className="text-xl font-serif font-bold text-stone-900">
                {formatCurrency(summary?.refunds.total || 0)}
              </p>
              <p className="text-xs text-stone-400">{summary?.refunds.count || 0} transaksi</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Methods */}
        <div className="rounded-[2.5rem] bg-white p-6 shadow-sm border border-stone-200">
          <h2 className="mb-6 text-lg font-serif font-bold text-stone-900">Metode Pembayaran</h2>
          {dailyReport?.by_payment_method && Object.keys(dailyReport.by_payment_method).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(dailyReport.by_payment_method).map(([method, data]) => (
                <div key={method} className="flex items-center justify-between p-3 hover:bg-stone-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-stone-50 rounded-lg">
                      {getPaymentIcon(method)}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900 text-sm">{getPaymentLabel(method)}</p>
                      <p className="text-xs text-stone-500">{data.count} transaksi</p>
                    </div>
                  </div>
                  <p className="font-bold text-stone-900">{formatCurrency(data.total)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-stone-500">Tidak ada data pembayaran</p>
          )}
        </div>

        {/* Popular Items */}
        <div className="rounded-[2.5rem] bg-white p-6 shadow-sm border border-stone-200">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-serif font-bold text-stone-900">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Produk Terlaris
          </h2>
          {popularItems.length > 0 ? (
            <div className="space-y-3">
              {popularItems.slice(0, 5).map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 hover:bg-stone-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      index === 0 
                        ? "bg-yellow-100 text-yellow-700 ring-4 ring-yellow-50" 
                        : index === 1 
                        ? "bg-stone-200 text-stone-700" 
                        : index === 2 
                        ? "bg-orange-100 text-orange-700"
                        : "bg-stone-100 text-stone-600"
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-stone-900 text-sm">{item.name}</p>
                      <p className="text-xs text-stone-500">{item.quantity} terjual</p>
                    </div>
                  </div>
                  <p className="font-bold text-stone-900 text-sm">{formatCurrency(item.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-stone-500">Tidak ada data produk</p>
          )}
        </div>

        {/* Order Status Summary */}
        <div className="rounded-[2.5rem] bg-white p-6 shadow-sm border border-stone-200 lg:col-span-2">
          <h2 className="mb-6 text-lg font-serif font-bold text-stone-900">Ringkasan Order</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-stone-50 p-4 text-center border border-stone-100">
              <p className="text-3xl font-serif font-bold text-stone-900">{summary?.orders.total || 0}</p>
              <p className="text-xs font-medium text-stone-500 mt-1 uppercase tracking-wide">Total Order</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4 text-center border border-emerald-100">
              <p className="text-3xl font-serif font-bold text-emerald-600">{summary?.orders.completed || 0}</p>
              <p className="text-xs font-medium text-emerald-600 mt-1 uppercase tracking-wide">Selesai</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4 text-center border border-amber-100">
              <p className="text-3xl font-serif font-bold text-amber-600">{summary?.orders.pending || 0}</p>
              <p className="text-xs font-medium text-amber-600 mt-1 uppercase tracking-wide">Pending</p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-4 text-center border border-rose-100">
              <p className="text-3xl font-serif font-bold text-rose-600">{summary?.orders.cancelled || 0}</p>
              <p className="text-xs font-medium text-rose-600 mt-1 uppercase tracking-wide">Dibatalkan</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions (from Daily Report) */}
        {dailyReport?.transactions && dailyReport.transactions.length > 0 && (
          <div className="rounded-[2.5rem] bg-white p-6 shadow-sm border border-stone-200 lg:col-span-2">
            <h2 className="mb-6 text-lg font-serif font-bold text-stone-900">
              Transaksi Terbaru ({selectedDate})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr className="text-left text-stone-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold">Metode</th>
                    <th className="px-4 py-3 font-semibold">Jumlah</th>
                    <th className="px-4 py-3 font-semibold">Kasir</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {dailyReport.transactions.slice(0, 10).map((tx) => (
                    <tr key={tx.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-stone-500">{tx.id.slice(0, 8)}...</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getPaymentIcon(tx.payment_method)}
                          <span className="text-stone-700 text-xs font-medium">{getPaymentLabel(tx.payment_method)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-stone-900">{formatCurrency(tx.amount)}</td>
                      <td className="px-4 py-3 text-stone-600">{tx.cashier_name}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          tx.refunded 
                            ? "bg-rose-100 text-rose-700 border-rose-200" 
                            : "bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}>
                          {tx.refunded ? "REFUND" : tx.status.toUpperCase()}
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
