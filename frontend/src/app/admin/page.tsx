/**
 * Admin Dashboard Page - Modern Design.
 */
"use client";

import { useState, useEffect } from "react";
import { 
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  MoreHorizontal
} from "lucide-react";
import Link from "next/link";
import { analyticsApi, type DashboardData, type SalesAnalytics } from "@/lib/api/index";

interface TopProduct {
  id: string;
  name: string;
  quantity_sold: number;
  revenue: number;
}

interface DailySales {
  date: string;
  revenue: number;
  transactions: number;
}

// Modern Stat Card Component
function StatCard({
  label,
  value,
  trend,
  trendUp,
}: {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-3xl sm:rounded-4xl shadow-sm border border-stone-100 hover:border-emerald-200 transition-colors group">
      <p className="text-stone-400 text-xs sm:text-sm font-medium mb-2 sm:mb-4">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-800">{value}</h3>
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

// Quick Action Pill Component
function QuickStatPill({
  icon: Icon,
  value,
  label,
  subLabel,
  color,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  subLabel: string;
  color: string;
}) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-stone-100 flex flex-col justify-center h-full hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${color}`}>
          <Icon size={18} className="sm:hidden" />
          <Icon size={20} className="hidden sm:block" />
        </div>
        <div>
          <h4 className="text-2xl sm:text-3xl font-serif font-bold text-stone-800">{value}</h4>
          <p className="text-xs sm:text-sm font-bold text-stone-600">{label}</p>
        </div>
      </div>
      <p className="text-[10px] sm:text-xs text-stone-400 pl-1">{subLabel}</p>
    </div>
  );
}

// Legend Item for Donut Chart
function LegendItem({
  color,
  label,
  value,
  amount,
}: {
  color: string;
  label: string;
  value: string;
  amount: string;
}) {
  return (
    <div className="flex items-center justify-between group cursor-default">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${color} ring-2 sm:ring-4 ring-white shrink-0`}></div>
        <span className="text-xs sm:text-sm font-medium text-stone-600 group-hover:text-stone-900 truncate">{label}</span>
      </div>
      <div className="text-right shrink-0 ml-2">
        <span className="text-[10px] sm:text-xs font-bold block text-stone-800">{value}</span>
        <span className="text-[9px] sm:text-[10px] text-stone-400">{amount}</span>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [dashboardData, productsData, salesData] = await Promise.all([
          analyticsApi.getDashboard(),
          analyticsApi.getProducts(4),
          analyticsApi.getSales("week"),
        ]);
        
        setDashboard(dashboardData);
        setTopProducts(productsData.top_products || []);
        setDailySales(salesData.daily || []);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError("Gagal memuat data dashboard");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)}jt`;
    }
    if (amount >= 1000) {
      return `Rp ${(amount / 1000).toFixed(0)}rb`;
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyFull = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-2 text-stone-500">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
          <h2 className="mt-4 text-lg font-semibold text-stone-900">
            {error || "Gagal memuat data"}
          </h2>
          <p className="mt-2 text-stone-500">Silakan coba lagi nanti</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-full bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700 transition-colors"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }
  
  // Get last 7 days sales data for bar chart
  // Fill in missing days with 0 revenue
  const last7Days: DailySales[] = [];
  const dayNames = ["Mg", "Sn", "Sl", "Rb", "Km", "Jm", "Sb"];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const existingData = dailySales.find(d => d.date === dateStr);
    last7Days.push({
      date: dateStr,
      revenue: existingData?.revenue || 0,
      transactions: existingData?.transactions || 0,
    });
  }
  
  const maxRevenue = Math.max(...last7Days.map(d => d.revenue), 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Revenue Card (Dark/Featured) */}
        <div className="col-span-2 sm:col-span-1 bg-emerald-900 text-white p-4 sm:p-6 rounded-3xl sm:rounded-4xl shadow-lg shadow-emerald-900/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-xl"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <p className="text-emerald-200 text-xs sm:text-sm font-medium">Total Revenue</p>
              <div className="p-1.5 bg-white/10 rounded-full rotate-45 group-hover:rotate-0 transition-transform">
                <ArrowUpRight size={14} />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold mb-1">{formatCurrency(dashboard.revenue.total)}</h3>
            <p className="text-[10px] sm:text-xs text-emerald-300">{formatCurrency(dashboard.revenue.today)} hari ini</p>
          </div>
        </div>

        {/* Orders Card */}
        <StatCard
          label="Total Orders"
          value={dashboard.orders.total.toLocaleString()}
          trend={`${dashboard.orders.today} hari ini`}
          trendUp={dashboard.orders.today > 0}
        />

        {/* Users Card */}
        <StatCard
          label="Total Users"
          value={dashboard.users.total.toLocaleString()}
          trend={`${dashboard.users.active} aktif`}
          trendUp={true}
        />

        {/* Products Card */}
        <StatCard
          label="Products"
          value={dashboard.products.total}
          trend={`${dashboard.products.available} aktif`}
          trendUp={true}
        />
      </div>

      {/* Chart & Top Products Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
        {/* Sales Analysis Chart */}
        <div className="xl:col-span-8 bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-stone-200">
          <div className="flex flex-wrap justify-between items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-stone-800">Analisa Penjualan</h3>
              <p className="text-stone-400 text-xs sm:text-sm">Revenue dari order selesai (7 hari terakhir)</p>
            </div>
            <div className="flex gap-2">
              <Link 
                href="/admin/analytics"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-stone-900 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors"
              >
                <ArrowUpRight size={14} className="sm:hidden" />
                <ArrowUpRight size={16} className="hidden sm:block" />
              </Link>
            </div>
          </div>

          {/* Bar Chart Visual - Using Real Data */}
          <div className="flex items-end justify-between h-40 sm:h-48 md:h-64 gap-1 sm:gap-2 md:gap-4 px-1 sm:px-2">
            {last7Days.map((day, i) => {
              const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              const isHighest = day.revenue === maxRevenue && day.revenue > 0;
              const dateObj = new Date(day.date);
              const dayName = dayNames[dateObj.getDay()];
              
              return (
                <div key={day.date} className="flex flex-col items-center gap-1 sm:gap-2 flex-1 group cursor-pointer">
                  <div className="w-full bg-stone-100 rounded-t-xl sm:rounded-t-2xl rounded-b-md sm:rounded-b-lg relative h-full flex items-end overflow-hidden group-hover:bg-emerald-50 transition-colors">
                    <div 
                      style={{ height: `${Math.max(height, 8)}%` }} 
                      className={`w-full ${isHighest ? "bg-emerald-500 shadow-lg shadow-emerald-200" : day.revenue > 0 ? "bg-emerald-300 group-hover:bg-emerald-400" : "bg-stone-200"} rounded-t-lg sm:rounded-t-xl transition-all duration-500 relative`}
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-8 sm:-top-10 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-[10px] sm:text-xs py-1 px-1.5 sm:px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {formatCurrency(day.revenue)}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold ${isHighest ? "text-emerald-600" : "text-stone-400"}`}>
                    {dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today Summary */}
        <div className="xl:col-span-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-stone-200">
          <h3 className="text-base sm:text-lg font-serif font-bold text-stone-800 mb-3 sm:mb-4">Ringkasan Hari Ini</h3>
          
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-emerald-50 rounded-xl sm:rounded-2xl">
              <div className="flex items-center gap-2 sm:gap-3">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                <span className="text-stone-700 font-medium text-sm sm:text-base">Pendapatan</span>
              </div>
              <span className="font-bold text-emerald-700 text-sm sm:text-base">
                {formatCurrency(dashboard.revenue.today)}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-xl sm:rounded-2xl">
              <div className="flex items-center gap-2 sm:gap-3">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <span className="text-stone-700 font-medium text-sm sm:text-base">Transaksi</span>
              </div>
              <span className="font-bold text-blue-700 text-sm sm:text-base">
                {dashboard.revenue.transactions_today}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 sm:p-4 bg-orange-50 rounded-xl sm:rounded-2xl">
              <div className="flex items-center gap-2 sm:gap-3">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                <span className="text-stone-700 font-medium text-sm sm:text-base">Order Baru</span>
              </div>
              <span className="font-bold text-orange-700 text-sm sm:text-base">
                {dashboard.orders.today}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 sm:p-4 bg-amber-50 rounded-xl sm:rounded-2xl">
              <div className="flex items-center gap-2 sm:gap-3">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                <span className="text-stone-700 font-medium text-sm sm:text-base">Pending</span>
              </div>
              <span className="font-bold text-amber-700 text-sm sm:text-base">
                {dashboard.orders.pending}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Quick Stats Pills */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4">
          <QuickStatPill
            icon={ShoppingCart}
            value={dashboard.orders.pending}
            label="Pesanan Pending"
            subLabel={`${dashboard.orders.today} order hari ini`}
            color="bg-amber-100 text-amber-600"
          />
          <QuickStatPill
            icon={Users}
            value={dashboard.users.active}
            label="User Aktif"
            subLabel={`dari ${dashboard.users.total} total user`}
            color="bg-rose-100 text-rose-600"
          />
        </div>

        {/* Donut Chart / Top Products */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8 relative overflow-hidden">
          {/* Donut Chart Visual */}
          <div className="relative w-28 h-28 sm:w-40 sm:h-40 shrink-0">
            {topProducts.length > 0 ? (
              <>
                <div 
                  className="w-full h-full rounded-full" 
                  style={{ 
                    background: (() => {
                      const total = topProducts.slice(0, 3).reduce((acc, p) => acc + p.quantity_sold, 0) || 1;
                      const colors = ["#10b981", "#f43f5e", "#8b5cf6"];
                      let gradient = "conic-gradient(";
                      let currentPercent = 0;
                      topProducts.slice(0, 3).forEach((product, i) => {
                        const percent = (product.quantity_sold / total) * 100;
                        gradient += `${colors[i]} ${currentPercent}% ${currentPercent + percent}%`;
                        currentPercent += percent;
                        if (i < Math.min(topProducts.length, 3) - 1) gradient += ", ";
                      });
                      // Fill remaining if less than 3 products
                      if (currentPercent < 100) {
                        gradient += `, #e7e5e4 ${currentPercent}% 100%`;
                      }
                      gradient += ")";
                      return gradient;
                    })()
                  }}
                ></div>
                <div className="absolute inset-3 sm:inset-4 bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="text-[10px] sm:text-sm text-stone-400 font-medium">Total</span>
                  <span className="text-base sm:text-xl font-bold font-serif text-stone-800">
                    {topProducts.slice(0, 3).reduce((acc, p) => acc + p.quantity_sold, 0)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div 
                  className="w-full h-full rounded-full bg-stone-200"
                ></div>
                <div className="absolute inset-3 sm:inset-4 bg-white rounded-full flex flex-col items-center justify-center">
                  <span className="text-[10px] sm:text-sm text-stone-400 font-medium">Total</span>
                  <span className="text-base sm:text-xl font-bold font-serif text-stone-800">0</span>
                </div>
              </>
            )}
          </div>

          {/* Legend */}
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="font-serif font-bold text-base sm:text-lg">Produk Terlaris</h3>
              <button className="p-1.5 sm:p-2 hover:bg-stone-50 rounded-full transition-colors">
                <MoreHorizontal size={14} className="sm:hidden text-stone-400" />
                <MoreHorizontal size={16} className="hidden sm:block text-stone-400" />
              </button>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {topProducts.length > 0 ? (
                topProducts.slice(0, 3).map((product, index) => {
                  const total = topProducts.slice(0, 3).reduce((acc, p) => acc + p.quantity_sold, 0) || 1;
                  const percent = Math.round((product.quantity_sold / total) * 100);
                  return (
                    <LegendItem 
                      key={product.id}
                      color={["bg-emerald-500", "bg-rose-500", "bg-violet-500"][index]}
                      label={product.name}
                      value={`${percent}%`}
                      amount={`${product.quantity_sold} terjual`}
                    />
                  );
                })
              ) : (
                <div className="text-center py-3 sm:py-4 text-stone-400">
                  <p className="text-xs sm:text-sm">Belum ada data penjualan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/products"
          className="flex items-center gap-3 sm:gap-4 rounded-2xl sm:rounded-4xl border border-stone-200 bg-white p-4 sm:p-5 transition-all hover:shadow-md hover:-translate-y-1 group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform shrink-0">
            <Package size={20} className="sm:hidden" />
            <Package size={24} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-stone-900 text-sm sm:text-base truncate">Kelola Produk</p>
            <p className="text-xs sm:text-sm text-stone-500 truncate">Tambah atau edit</p>
          </div>
        </Link>
        
        <Link
          href="/admin/users"
          className="flex items-center gap-3 sm:gap-4 rounded-2xl sm:rounded-4xl border border-stone-200 bg-white p-4 sm:p-5 transition-all hover:shadow-md hover:-translate-y-1 group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shrink-0">
            <Users size={20} className="sm:hidden" />
            <Users size={24} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-stone-900 text-sm sm:text-base truncate">Kelola Users</p>
            <p className="text-xs sm:text-sm text-stone-500 truncate">Atur role</p>
          </div>
        </Link>
        
        <Link
          href="/admin/analytics"
          className="flex items-center gap-3 sm:gap-4 rounded-2xl sm:rounded-4xl border border-stone-200 bg-white p-4 sm:p-5 transition-all hover:shadow-md hover:-translate-y-1 group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shrink-0">
            <TrendingUp size={20} className="sm:hidden" />
            <TrendingUp size={24} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-stone-900 text-sm sm:text-base truncate">Analytics</p>
            <p className="text-xs sm:text-sm text-stone-500 truncate">Laporan penjualan</p>
          </div>
        </Link>
        
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 sm:gap-4 rounded-2xl sm:rounded-4xl border border-stone-200 bg-white p-4 sm:p-5 transition-all hover:shadow-md hover:-translate-y-1 group"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-stone-100 flex items-center justify-center text-stone-600 group-hover:scale-110 transition-transform shrink-0">
            <Package size={20} className="sm:hidden" />
            <Package size={24} className="hidden sm:block" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-stone-900 text-sm sm:text-base truncate">Pengaturan</p>
            <p className="text-xs sm:text-sm text-stone-500 truncate">Konfigurasi toko</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
