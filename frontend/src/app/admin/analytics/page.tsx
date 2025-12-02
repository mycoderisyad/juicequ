"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  Loader2,
  AlertCircle
} from "lucide-react";
import { analyticsApi } from "@/lib/api/admin";

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
  trend,
  color,
}: {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  trend?: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`rounded-xl ${color} p-3`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{title}</p>
        {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
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
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
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
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-red-600">
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500">Track your business performance</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${(dashboard?.revenue.total || 0).toLocaleString()}`}
          subValue={`$${(dashboard?.revenue.today || 0).toFixed(2)} today`}
          icon={DollarSign}
          color="bg-green-600"
          trend={12}
        />
        <StatCard
          title="Total Orders"
          value={dashboard?.orders.total || 0}
          subValue={`${dashboard?.orders.today || 0} today, ${dashboard?.orders.pending || 0} pending`}
          icon={ShoppingCart}
          color="bg-blue-600"
          trend={8}
        />
        <StatCard
          title="Total Users"
          value={dashboard?.users.total || 0}
          subValue={`${dashboard?.users.active || 0} active`}
          icon={Users}
          color="bg-purple-600"
          trend={5}
        />
        <StatCard
          title="Products"
          value={dashboard?.products.total || 0}
          subValue={`${dashboard?.products.available || 0} available`}
          icon={Package}
          color="bg-orange-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Summary */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Sales Summary
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900">
                  ${(sales?.summary.total_revenue || 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div>
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-xl font-bold text-gray-900">
                  {sales?.summary.total_transactions || 0}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
              <div>
                <p className="text-sm text-gray-500">Average Transaction</p>
                <p className="text-xl font-bold text-gray-900">
                  ${(sales?.summary.average_transaction || 0).toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Package className="h-5 w-5 text-orange-600" />
            Top Products
          </h2>
          {products?.top_products && products.top_products.length > 0 ? (
            <div className="space-y-3">
              {products.top_products.slice(0, 5).map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-xl bg-gray-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.quantity_sold} sold</p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">
                    ${product.revenue.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No product data available</p>
          )}
        </div>
      </div>

      {/* Daily Sales Chart (Simple) */}
      {sales?.daily && sales.daily.length > 0 && (
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Daily Sales</h2>
          <div className="flex items-end gap-2 h-48">
            {sales.daily.slice(-7).map((day, index) => {
              const maxRevenue = Math.max(...sales.daily.slice(-7).map(d => d.revenue));
              const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full bg-green-500 rounded-t-lg transition-all hover:bg-green-600"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`$${day.revenue.toFixed(2)}`}
                  />
                  <span className="text-xs text-gray-500">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
