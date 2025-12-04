"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartSummary } from "@/components/cart";
import { ArrowLeft, CreditCard, Banknote, Smartphone, ShoppingBag, CheckCircle } from "lucide-react";
import { useCartStore, useAuthStore } from "@/lib/store";
import { api } from "@/lib/api";
import { useCurrency } from "@/lib/hooks/use-store";

type PaymentMethod = "cash" | "qris" | "transfer";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { format: formatCurrency } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  
  const cartTotal = total();
  const tax = cartTotal * 0.1;

  // Helper to ensure price is valid number
  const getValidPrice = (price: number | string | undefined): number => {
    if (typeof price === 'number' && !isNaN(price)) return price;
    if (typeof price === 'string') {
      const parsed = parseFloat(price);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Helper to get image URL from item (check image, then color if it's a URL)
  const getItemImage = (item: { image?: string; color?: string }) => {
    if (item.image) return item.image;
    // Check if color is actually an image URL (not a CSS class)
    if (item.color && (item.color.startsWith('http') || item.color.startsWith('/'))) {
      return item.color;
    }
    return null;
  };

  const handleSubmitOrder = async () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/checkout");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const orderData = {
        items: items.map((item) => ({
          product_id: String(item.id),
          name: item.name,
          price: getValidPrice(item.price),
          quantity: item.quantity,
        })),
        notes: notes || undefined,
        payment_method: paymentMethod,
      };

      const response = await api.post("/customer/orders", orderData);
      
      if (response.data.success) {
        clearCart();
        setOrderSuccess(response.data.order.order_number || response.data.order.id);
      } else {
        setError(response.data.message || "Failed to place order");
      }
    } catch (err: unknown) {
      console.error("Order error:", err);
      const errorMessage = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Failed to place order. Please try again."
        : "Failed to place order. Please try again.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="mx-auto max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Order Placed!</h1>
            <p className="mt-4 text-gray-600">
              Your order <span className="font-semibold">{orderSuccess}</span> has been placed successfully.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              We&apos;ll start preparing your delicious juice right away!
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/orders">
                <Button className="w-full sm:w-auto">View Orders</Button>
              </Link>
              <Link href="/menu">
                <Button variant="outline" className="w-full sm:w-auto">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <ShoppingBag className="h-16 w-16 text-gray-300" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Your cart is empty</h1>
            <p className="mt-2 text-gray-500">Add some items before checkout</p>
            <Link href="/menu" className="mt-6 inline-block">
              <Button>Browse Menu</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4">
          <Link
            href="/cart"
            className="mb-8 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Link>

          <h1 className="mb-8 text-3xl font-bold text-gray-900">Checkout</h1>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items Summary */}
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Order Items ({items.length})
                </h2>
                <div className="space-y-4">
                  {items.map((item) => {
                    const imageUrl = getItemImage(item);
                    const itemPrice = getValidPrice(item.price);
                    return (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={item.name}
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                          ) : (
                            <div className={`h-12 w-12 rounded-xl ${item.color || "bg-gray-100"}`} />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(itemPrice * item.quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Method */}
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Payment Method
                </h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <button
                    onClick={() => setPaymentMethod("cash")}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition-colors ${
                      paymentMethod === "cash"
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Banknote className="h-6 w-6 text-green-600" />
                    <span className="font-medium text-gray-900">Cash</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("qris")}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition-colors ${
                      paymentMethod === "qris"
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Smartphone className="h-6 w-6 text-blue-600" />
                    <span className="font-medium text-gray-900">QRIS</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("transfer")}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition-colors ${
                      paymentMethod === "transfer"
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <CreditCard className="h-6 w-6 text-purple-600" />
                    <span className="font-medium text-gray-900">Transfer</span>
                  </button>
                </div>
              </div>

              {/* Special Instructions */}
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Special Instructions
                </h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special requests? (e.g., less ice, extra sweet)"
                  className="w-full rounded-xl border border-gray-200 p-4 text-gray-900 placeholder:text-gray-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
                  rows={3}
                />
              </div>

              {/* Contact Info (if logged in) */}
              {isAuthenticated && user && (
                <div className="rounded-3xl bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    Contact Information
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <Input value={user.full_name} disabled className="text-gray-900 disabled:text-gray-700 disabled:opacity-100" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <Input value={user.email} disabled className="text-gray-900 disabled:text-gray-700 disabled:opacity-100" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <CartSummary
                  subtotal={cartTotal}
                  tax={tax}
                  onCheckout={handleSubmitOrder}
                  isCheckoutDisabled={isSubmitting || !isAuthenticated}
                  checkoutLabel={
                    !isAuthenticated
                      ? "Login to Order"
                      : isSubmitting
                      ? "Placing Order..."
                      : "Place Order"
                  }
                />
                
                {!isAuthenticated && (
                  <div className="mt-4 rounded-xl bg-yellow-50 p-4 text-center text-sm text-yellow-700">
                    <Link href="/login?redirect=/checkout" className="font-medium hover:underline">
                      Login
                    </Link>
                    {" "}to place your order
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
