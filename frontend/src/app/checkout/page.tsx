"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartSummary } from "@/components/cart";
import { ArrowLeft, CreditCard, Banknote, Smartphone, ShoppingBag, CheckCircle, Calendar, Clock, Ticket, Check, X, Loader2 } from "lucide-react";
import { useCartStore, useAuthStore } from "@/lib/store";
import apiClient from "@/lib/api/config";
import { useCurrency } from "@/lib/hooks/use-store";
import { getImageUrl } from "@/lib/image-utils";
import { vouchersApi } from "@/lib/api/customer";
import type { CartItem } from "@/lib/store";

type PaymentMethod = "cash" | "qris" | "transfer" | "card";

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

  // Pre-order scheduling state
  const [isPreorder, setIsPreorder] = useState(false);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");

  // Voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<{
    id: string;
    code: string;
    discount_type: "percentage" | "fixed_amount";
    discount_value: number;
    discount_amount: number;
  } | null>(null);
  const [enabledPayments, setEnabledPayments] = useState<PaymentMethod[]>([]);

  const cartTotal = total();
  const tax = cartTotal * 0.1;
  const voucherDiscount = appliedVoucher?.discount_amount || 0;
  const finalTotal = Math.max(0, cartTotal + tax - voucherDiscount);

  // Get minimum date for pre-order (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // Get maximum date for pre-order (7 days from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    return maxDate.toISOString().split("T")[0];
  };

  // Available pickup time slots
  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00",
  ];

  // Apply voucher
  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError("Masukkan kode voucher");
      return;
    }

    setVoucherLoading(true);
    setVoucherError(null);

    try {
      const result = await vouchersApi.validate(voucherCode.trim(), cartTotal);

      if (result.valid && result.voucher) {
        setAppliedVoucher({
          ...result.voucher,
          discount_amount: result.discount_amount,
        });
        setVoucherCode("");
      } else {
        setVoucherError(result.message || "Voucher tidak valid");
      }
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        setVoucherError(axiosError.response?.data?.detail || "Gagal memvalidasi voucher");
      } else {
        setVoucherError("Gagal memvalidasi voucher");
      }
    } finally {
      setVoucherLoading(false);
    }
  };

  // Fetch payment methods availability from public settings
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await apiClient.get("/customer/store/payment-methods");
        const data = res.data;
        const methods: PaymentMethod[] = (data.methods || []).map((m: { id: string }) => {
          if (m.id === "ewallet") return "qris";
          if (m.id === "card") return "card";
          return m.id as PaymentMethod;
        });
        if (methods.length > 0) {
          setEnabledPayments(methods);
          if (!methods.includes(paymentMethod)) {
            setPaymentMethod(methods[0]);
          }
        }
      } catch {
        // ignore fetch errors, keep defaults
      }
    };
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remove voucher
  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherError(null);
  };

  const isPaymentEnabled = (method: PaymentMethod) => enabledPayments.includes(method);

  const paymentButtons: Array<{ id: PaymentMethod; label: string; icon: React.ReactNode }> = [
    { id: "cash", label: "Cash", icon: <Banknote className="h-6 w-6 text-green-600" /> },
    { id: "qris", label: "QRIS", icon: <Smartphone className="h-6 w-6 text-blue-600" /> },
    { id: "transfer", label: "Transfer", icon: <CreditCard className="h-6 w-6 text-purple-600" /> },
  ];

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
    if (item.image) return getImageUrl(item.image);
    // Check if color is actually an image URL (not a CSS class)
    if (item.color && (item.color.startsWith('http') || item.color.startsWith('/'))) {
      return getImageUrl(item.color);
    }
    return null;
  };

  const resolveProductId = (item: CartItem) => {
    if (item.productId) return String(item.productId);
    return String(item.id).replace(/-(small|medium|large)$/i, "");
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

    // Validate pre-order fields if enabled
    if (isPreorder) {
      if (!pickupDate) {
        setError("Pilih tanggal pengambilan untuk pre-order");
        return;
      }
      if (!pickupTime) {
        setError("Pilih waktu pengambilan untuk pre-order");
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const orderData = {
        items: items.map((item) => ({
          product_id: resolveProductId(item),
          name: item.name,
          price: getValidPrice(item.price),
          quantity: item.quantity,
          size: item.size || "medium",
        })),
        notes: notes || undefined,
        payment_method: paymentMethod,
        // Pre-order fields
        is_preorder: isPreorder,
        scheduled_pickup_date: isPreorder ? pickupDate : undefined,
        scheduled_pickup_time: isPreorder ? pickupTime : undefined,
        // Voucher fields
        voucher_id: appliedVoucher?.id,
        voucher_code: appliedVoucher?.code,
        voucher_discount: voucherDiscount,
      };

      const response = await apiClient.post("/customer/orders", orderData);

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
                  {paymentButtons.map((btn) => {
                    const enabled = isPaymentEnabled(btn.id);
                    const active = paymentMethod === btn.id;
                    return (
                      <button
                        key={btn.id}
                        onClick={() => enabled && setPaymentMethod(btn.id)}
                        disabled={!enabled}
                        className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition-colors ${active ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-gray-300"
                          } ${!enabled ? "opacity-60 cursor-not-allowed bg-gray-50 hover:border-gray-200" : ""}`}
                      >
                        {btn.icon}
                        <span className="font-medium text-gray-900">{btn.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pre-order Scheduling */}
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    Jadwal Pengambilan
                  </h2>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={isPreorder}
                      onChange={(e) => {
                        setIsPreorder(e.target.checked);
                        if (!e.target.checked) {
                          setPickupDate("");
                          setPickupTime("");
                        }
                      }}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-green-300"></div>
                    <span className="ml-2 text-sm text-gray-600">Pre-order</span>
                  </label>
                </div>

                {isPreorder ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                      Pesan sekarang, ambil sesuai jadwal yang dipilih. Pre-order tersedia untuk 1-7 hari ke depan.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Tanggal Pengambilan
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                          <input
                            type="date"
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            min={getMinDate()}
                            max={getMaxDate()}
                            className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Waktu Pengambilan
                        </label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                          <select
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
                          >
                            <option value="">Pilih waktu</option>
                            {timeSlots.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    {pickupDate && pickupTime && (
                      <div className="rounded-xl bg-green-50 p-4">
                        <p className="text-sm text-green-700">
                          <span className="font-semibold">Jadwal Pickup:</span> {new Date(pickupDate).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} pukul {pickupTime}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Pesanan akan diproses segera setelah pembayaran dikonfirmasi. Aktifkan pre-order untuk menjadwalkan pengambilan.
                  </p>
                )}
              </div>

              {/* Voucher */}
              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-green-600" />
                  Kode Voucher
                </h2>

                {appliedVoucher ? (
                  <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-700">{appliedVoucher.code}</span>
                      </div>
                      <span className="text-sm text-green-600">
                        {appliedVoucher.discount_type === "percentage"
                          ? `Diskon ${appliedVoucher.discount_value}%`
                          : `Diskon ${formatCurrency(appliedVoucher.discount_value)}`
                        } (-{formatCurrency(appliedVoucher.discount_amount)})
                      </span>
                    </div>
                    <button
                      onClick={handleRemoveVoucher}
                      className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => {
                        setVoucherCode(e.target.value.toUpperCase());
                        setVoucherError(null);
                      }}
                      placeholder="Masukkan kode voucher"
                      className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                    <Button
                      onClick={handleApplyVoucher}
                      disabled={voucherLoading || !voucherCode.trim()}
                      className="rounded-xl bg-green-600 px-4 hover:bg-green-700 disabled:bg-gray-300"
                    >
                      {voucherLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Pakai"
                      )}
                    </Button>
                  </div>
                )}

                {voucherError && (
                  <p className="mt-2 text-sm text-red-500">{voucherError}</p>
                )}
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
                  discount={voucherDiscount}
                  onCheckout={handleSubmitOrder}
                  isCheckoutDisabled={isSubmitting || !isAuthenticated || (isPreorder && (!pickupDate || !pickupTime))}
                  checkoutLabel={
                    !isAuthenticated
                      ? "Login to Order"
                      : isSubmitting
                        ? "Placing Order..."
                        : isPreorder
                          ? "Place Pre-order"
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
