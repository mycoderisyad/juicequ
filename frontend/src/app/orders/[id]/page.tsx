"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChefHat,
  Banknote,
  Smartphone,
  CreditCard,
  Star,
  StarHalf,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import apiClient from "@/lib/api/config";
import { useCurrency } from "@/lib/hooks/use-store";

interface OrderItem {
  id: string;
  product_id: string;
  product_name?: string;
  name?: string;
  price?: number;
  unit_price?: number;
  quantity: number;
  subtotal?: number;
  size?: string;
  notes?: string;
}

interface Order {
  id: string;
  order_number?: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  tax: number;
  total: number;
  payment_method?: string;
  customer_notes?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

const statusConfig: Record<string, { color: "default" | "secondary" | "success" | "warning" | "destructive" | "info"; icon: React.ReactNode; label: string }> = {
  pending: { color: "warning", icon: <Clock className="h-4 w-4" />, label: "Pending" },
  confirmed: { color: "info", icon: <CheckCircle className="h-4 w-4" />, label: "Confirmed" },
  preparing: { color: "info", icon: <ChefHat className="h-4 w-4" />, label: "Preparing" },
  ready: { color: "success", icon: <Package className="h-4 w-4" />, label: "Ready for Pickup" },
  completed: { color: "success", icon: <CheckCircle className="h-4 w-4" />, label: "Completed" },
  cancelled: { color: "destructive", icon: <XCircle className="h-4 w-4" />, label: "Cancelled" },
};

const paymentIcons: Record<string, React.ReactNode> = {
  cash: <Banknote className="h-5 w-5 text-green-600" />,
  qris: <Smartphone className="h-5 w-5 text-blue-600" />,
  transfer: <CreditCard className="h-5 w-5 text-purple-600" />,
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { format } = useCurrency();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [ratings, setRatings] = useState<Record<string, { rating: number; review: string }>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem("order-ratings");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const orderId = params?.id as string;

  const fetchOrder = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/customer/orders/${orderId}`);
      setOrder(response.data);
    } catch (err) {
      console.error("Failed to fetch order:", err);
      setError("Order not found or you don't have permission to view it");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/orders");
      return;
    }

    if (orderId) {
      fetchOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, orderId, router]);

  const handleCancelOrder = async () => {
    if (!order || order.status !== "pending") return;

    const confirmed = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmed) return;

    try {
      setIsCancelling(true);
      await apiClient.post(`/customer/orders/${orderId}/cancel`);
      await fetchOrder();
    } catch (err) {
      console.error("Failed to cancel order:", err);
      setError("Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const persistRatings = (next: Record<string, { rating: number; review: string }>) => {
    setRatings(next);
    try {
      localStorage.setItem("order-ratings", JSON.stringify(next));
    } catch {
      // ignore write failures
    }
  };

  const getRatingKey = (productId?: string) => `${orderId || "order"}:${productId || "unknown"}`;

  const handleRatingChange = (productId?: string, value?: number) => {
    if (!productId || !value) return;
    const key = getRatingKey(productId);
    const next = { ...ratings, [key]: { rating: value, review: ratings[key]?.review || "" } };
    persistRatings(next);
    setSaveMessage("Rating disimpan (local).");
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const handleReviewChange = (productId?: string, text?: string) => {
    if (!productId) return;
    const key = getRatingKey(productId);
    const next = { ...ratings, [key]: { rating: ratings[key]?.rating || 0, review: text || "" } };
    persistRatings(next);
  };

  const renderStars = (productId?: string) => {
    if (!productId) return null;
    const key = getRatingKey(productId);
    const current = ratings[key]?.rating || 0;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleRatingChange(productId, value)}
            className="group"
            aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                value <= current ? "text-amber-500" : "text-gray-300 group-hover:text-amber-400"
              }`}
              fill={value <= current ? "#f59e0b" : "none"}
            />
          </button>
        ))}
      </div>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex-1 py-10">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-32 mb-8" />
            <div className="rounded-3xl bg-white p-8 shadow-sm">
              <Skeleton className="h-8 w-48 mb-4" />
              <Skeleton className="h-6 w-64 mb-8" />
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex-1 py-10">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Order Not Found
            </h1>
            <p className="text-gray-500 mb-8">{error}</p>
            <Link href="/orders">
              <Button>Back to Orders</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;
  const displayOrderId = order.order_number || order.id;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4">
          <Link
            href="/orders"
            className="mb-8 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Order #{displayOrderId}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>
                  <Badge variant={status.color} className="flex items-center gap-1 text-base px-4 py-2">
                    {status.icon}
                    {status.label}
                  </Badge>
                </div>
              </div>

              {/* Order Items */}
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Items
                </h2>
                <div className="space-y-4">
                  {order.items.map((item, index) => {
                    const itemName = item.product_name || item.name || "Unknown Product";
                    const itemPrice = item.unit_price || item.price || 0;
                    const itemSubtotal = item.subtotal || itemPrice * item.quantity;
                    const ratingKey = getRatingKey(item.product_id);
                    const userRating = ratings[ratingKey]?.rating || 0;
                    const userReview = ratings[ratingKey]?.review || "";
                    
                    return (
                      <div key={item.id || index} className="space-y-3 py-4 border-b border-gray-100 last:border-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                              <span className="text-lg">🥤</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{itemName}</p>
                              <p className="text-sm text-gray-500">
                                {format(itemPrice)} × {item.quantity}
                                {item.size && ` · ${item.size}`}
                              </p>
                              {item.notes && (
                                <p className="text-xs text-gray-400 mt-1">{item.notes}</p>
                              )}
                            </div>
                          </div>
                          <p className="font-semibold text-gray-900">
                            {format(itemSubtotal)}
                          </p>
                        </div>
                        {order.status === "completed" && (
                          <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">Beri rating & ulasan</p>
                                <p className="text-xs text-gray-500">Review akan tampil di AI Fotobooth & detail produk.</p>
                              </div>
                              {saveMessage && (
                                <span className="text-xs text-emerald-600">{saveMessage}</span>
                              )}
                            </div>
                            
                            <div className="mt-3 flex items-center gap-2">
                              {renderStars(item.product_id)}
                              <span className="text-xs text-gray-500">{userRating ? `${userRating}/5` : "Belum dipilih"}</span>
                            </div>
                            
                            <div className="mt-3">
                              <textarea
                                className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 focus:border-emerald-500 focus:ring-emerald-500"
                                placeholder="Tulis pengalamanmu setelah beli produk ini..."
                                value={userReview}
                                onChange={(e) => handleReviewChange(item.product_id, e.target.value)}
                                rows={3}
                              />
                              <p className="text-[11px] text-gray-500 mt-1">
                                Disimpan di perangkat ini. Akan disinkronkan ke profil saat fitur review aktif.
                              </p>
                            </div>

                          <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-3">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">AI Fotobooth (Coming Soon)</p>
                                <p className="text-xs text-gray-600">Tambahkan momen foto AI untuk ulasan produkmu.</p>
                              </div>
                              <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-200" disabled>
                                Coming Soon
                              </Button>
                            </div>
                            <p className="mt-2 text-[11px] text-gray-600">
                              Saat fitur aktif, kamu bisa upload selfie dan AI akan membuat foto bersama produk ini. Hasilnya akan muncul di ulasan produk.
                            </p>
                          </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Special Instructions */}
              {(order.customer_notes || order.notes) && (
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Special Instructions
                  </h2>
                  <p className="text-gray-600">{order.customer_notes || order.notes}</p>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Payment Summary */}
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Payment Summary
                  </h2>
                  
                  {order.payment_method && (
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                      {paymentIcons[order.payment_method] || <CreditCard className="h-5 w-5 text-gray-700" />}
                      <span className="capitalize font-semibold text-gray-900">
                        {order.payment_method}
                      </span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{format(order.subtotal)}</span>
                    </div>
                    {order.discount && order.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-{format(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span>{format(order.tax)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-100">
                      <span>Total</span>
                      <span>{format(order.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {order.status === "pending" && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                  >
                    {isCancelling ? "Cancelling..." : "Cancel Order"}
                  </Button>
                )}

                <Link href="/menu" className="block">
                  <Button variant="outline" className="w-full">
                    Order Again
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
