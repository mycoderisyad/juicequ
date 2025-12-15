"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  Loader2,
  AlertCircle,
  Calendar,
  TrendingUp
} from "lucide-react";
import { analyticsApi } from "@/lib/api/admin";
import { useCurrency } from "@/lib/hooks/use-store";

interface DashboardData {
  users: { total: number; active: number };
  products: { total: number; available: number };
  orders: { total: number; today: number; pending: number };
  revenue: { today: number; total: number; transactions_today: number };
}

interface SalesData {
  period: string;
  summary: {
    total_revenue: number;
    total_transactions: number;
    average_transaction: number;
  };
  daily: Array<{ date: string; revenue: number; transactions: number }>;
}

interface ProductAnalytics {
  top_products: Array<{
    id: string;
    name: string;
    quantity_sold: number;
    revenue: number;
  }>;
}

function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  color: "emerald" | "stone" | "amber";
}) {
  const colorClasses = {
    emerald: { bg: "bg-emerald-100", text: "text-emerald-600" },
    stone: { bg: "bg-stone-100", text: "text-stone-600" },
    amber: { bg: "bg-amber-100", text: "text-amber-600" },
  };
  const { bg, text } = colorClasses[color];
  
  return (
    <div className="rounded-4xl bg-white p-6 shadow-sm border border-stone-100">
      <div className="flex items-center justify-between">
        <div className={`rounded-2xl p-3 ${bg}`}>
          <Icon className={`h-6 w-6 ${text}`} />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-stone-900">{value}</p>
        <p className="text-sm text-stone-500 mt-1">{title}</p>
        {subValue && <p className="text-xs text-stone-400 mt-1">{subValue}</p>}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { format } = useCurrency();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [sales, setSales] = useState<SalesData | null>(null);
  const [products, setProducts] = useState<ProductAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("week");

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [dashboardRes, salesRes, productsRes] = await Promise.all([
        analyticsApi.getDashboard(),
        analyticsApi.getSales(period),
        analyticsApi.getProducts(10),
      ]);
      
      setDashboard(dashboardRes);
      setSales(salesRes);
      setProducts(productsRes);
    } catch {
      setError("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-rose-50 p-6 text-rose-600 border border-rose-200">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Analytics</h1>
          <p className="text-stone-500">Track your business performance</p>
        </div>
        <div className="relative">
          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-full border border-stone-200 bg-white pl-10 pr-4 py-2.5 text-sm text-stone-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={format(dashboard?.revenue.total || 0)}
          subValue={`${format(dashboard?.revenue.today || 0)} today`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Total Orders"
          value={dashboard?.orders.total || 0}
          subValue={`${dashboard?.orders.today || 0} today, ${dashboard?.orders.pending || 0} pending`}
          icon={ShoppingCart}
          color="stone"
        />
        <StatCard
          title="Total Users"
          value={dashboard?.users.total || 0}
          subValue={`${dashboard?.users.active || 0} active`}
          icon={Users}
          color="stone"
        />
        <StatCard
          title="Products"
          value={dashboard?.products.total || 0}
          subValue={`${dashboard?.products.available || 0} available`}
          icon={Package}
          color="amber"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Summary */}
        <div className="rounded-4xl bg-white p-6 shadow-sm">
          <h2 className="mb-6 flex items-center gap-2 font-serif text-lg font-semibold text-stone-900">
            <div className="rounded-xl bg-emerald-100 p-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
            </div>
            Sales Summary
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-4">
              <div>
                <p className="text-sm text-stone-500">Total Revenue</p>
                <p className="text-xl font-bold text-stone-900 mt-1">
                  {format(sales?.summary.total_revenue || 0)}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-100 p-3">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-4">
              <div>
                <p className="text-sm text-stone-500">Total Transactions</p>
                <p className="text-xl font-bold text-stone-900 mt-1">
                  {sales?.summary.total_transactions || 0}
                </p>
              </div>
              <div className="rounded-xl bg-stone-100 p-3">
                <ShoppingCart className="h-6 w-6 text-stone-600" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-stone-50 p-4">
              <div>
                <p className="text-sm text-stone-500">Average Transaction</p>
                <p className="text-xl font-bold text-stone-900 mt-1">
                  {format(sales?.summary.average_transaction || 0)}
                </p>
              </div>
              <div className="rounded-xl bg-amber-100 p-3">
                <TrendingUp className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-4xl bg-white p-6 shadow-sm border border-stone-100">
          <h2 className="mb-6 flex items-center gap-2 font-serif text-lg font-semibold text-stone-900">
            <div className="rounded-xl bg-amber-100 p-2">
              <Package className="h-5 w-5 text-amber-600" />
            </div>
            Top Products
          </h2>
          {products?.top_products && products.top_products.length > 0 ? (
            <div className="space-y-3">
              {products.top_products.slice(0, 5).map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-2xl bg-stone-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                      index === 0 ? "bg-emerald-100 text-emerald-700" :
                      index === 1 ? "bg-stone-200 text-stone-700" :
                      index === 2 ? "bg-amber-100 text-amber-700" :
                      "bg-stone-100 text-stone-600"
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-stone-900">{product.name}</p>
                      <p className="text-xs text-stone-500">{product.quantity_sold} sold</p>
                    </div>
                  </div>
                  <p className="font-semibold text-emerald-600">
                    {format(product.revenue)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-stone-100 p-3 mb-3">
                <Package className="h-6 w-6 text-stone-400" />
              </div>
              <p className="text-stone-500">No product data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Daily Sales Chart - Always show last 7 days */}
      <div className="mt-6 rounded-4xl bg-white p-6 shadow-sm">
        <h2 className="mb-6 font-serif text-lg font-semibold text-stone-900">Daily Sales</h2>
        <div className="flex items-end gap-2 h-48">
          {(() => {
            // Generate last 7 days
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
              const date = new Date();
              date.setDate(date.getDate() - i);
              const dateStr = date.toISOString().split('T')[0];
              const existingData = sales?.daily?.find(d => d.date === dateStr);
              last7Days.push({
                date: dateStr,
                revenue: existingData?.revenue || 0,
                dayName: dayNames[date.getDay()],
              });
            }
            const maxRevenue = Math.max(...last7Days.map(d => d.revenue), 1);
            
            return last7Days.map((day, index) => {
              const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              const isHighest = day.revenue === maxRevenue && day.revenue > 0;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full bg-stone-100 rounded-t-xl h-full flex items-end">
                    <div
                      className={`w-full ${isHighest ? "bg-emerald-500" : day.revenue > 0 ? "bg-emerald-400" : "bg-stone-200"} rounded-t-xl transition-all hover:bg-emerald-600 cursor-pointer group relative`}
                      style={{ height: `${Math.max(height, 8)}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {format(day.revenue)}
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${isHighest ? "text-emerald-600" : "text-stone-500"}`}>
                    {day.dayName}
                  </span>
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
}
