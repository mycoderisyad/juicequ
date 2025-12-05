"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Clock, CheckCircle, XCircle, ChefHat, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import apiClient from "@/lib/api/config";
import { useCurrency } from "@/lib/hooks/use-store";

interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  order_number?: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment_method?: string;
  created_at: string;
  updated_at?: string;
}

const statusConfig: Record<string, { color: "default" | "secondary" | "success" | "warning" | "destructive" | "info"; icon: React.ReactNode; label: string }> = {
  pending: {
    color: "warning",
    icon: <Clock className="h-4 w-4" />,
    label: "Pending",
  },
  confirmed: {
    color: "info",
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Confirmed",
  },
  preparing: {
    color: "info",
    icon: <ChefHat className="h-4 w-4" />,
    label: "Preparing",
  },
  ready: {
    color: "success",
    icon: <Package className="h-4 w-4" />,
    label: "Ready",
  },
  completed: {
    color: "success",
    icon: <CheckCircle className="h-4 w-4" />,
    label: "Completed",
  },
  cancelled: {
    color: "destructive",
    icon: <XCircle className="h-4 w-4" />,
    label: "Cancelled",
  },
};

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { format } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/orders");
      return;
    }

    fetchOrders();
  }, [isAuthenticated, router]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/customer/orders");
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">My Orders</h1>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-3xl bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-4 w-36" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-12 text-center shadow-sm">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <Package className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                No orders yet
              </h2>
              <p className="mt-2 text-gray-500">
                Your order history will appear here
              </p>
              <Link href="/menu" className="mt-8">
                <Button className="rounded-full bg-green-600 px-8 py-6 text-lg hover:bg-green-700">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const displayOrderId = order.order_number || order.id;
                
                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block rounded-3xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-lg font-bold text-gray-900">
                            Order #{displayOrderId}
                          </h2>
                          <Badge variant={status.color} className="flex items-center gap-1">
                            {status.icon}
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </p>
                        <p className="mt-2 text-sm text-gray-600">
                          {order.items.length} {order.items.length === 1 ? "item" : "items"}
                          {" · "}
                          {order.items.map(i => i.name).join(", ").slice(0, 50)}
                          {order.items.map(i => i.name).join(", ").length > 50 ? "..." : ""}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {format(order.total)}
                          </p>
                          {order.payment_method && (
                            <p className="text-sm capitalize text-gray-500">
                              {order.payment_method}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
