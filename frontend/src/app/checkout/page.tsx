"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { CartSummary } from "@/components/cart";
import { ArrowLeft, ShoppingBag, CheckCircle, Ticket } from "lucide-react";
import { useCartStore, useAuthStore } from "@/lib/store";
import apiClient from "@/lib/api/config";
import { useCurrency } from "@/lib/hooks/use-store";
import { getApiErrorMessage } from "@/lib/utils/error-handler";
import { useVoucher, VoucherInput } from "@/features/cart";
import {
  PaymentMethodSelector,
  PreorderScheduler,
  OrderItemsSummary,
  ContactInfo,
  SpecialInstructions,
  type PaymentMethod,
} from "@/features/checkout";
import type { CartItem } from "@/lib/store";

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
  const [isPreorder, setIsPreorder] = useState(false);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [enabledPayments, setEnabledPayments] = useState<PaymentMethod[]>([]);

  const {
    voucherCode,
    setVoucherCode,
    isLoading: voucherLoading,
    error: voucherError,
    appliedVoucher,
    applyVoucher,
    removeVoucher,
  } = useVoucher();

  const cartTotal = total();
  const tax = cartTotal * 0.1;
  const voucherDiscount = appliedVoucher?.discount_amount || 0;
  const finalTotal = Math.max(0, cartTotal + tax - voucherDiscount);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await apiClient.get("/customer/store/payment-methods");
        const data = res.data;
        const methods: PaymentMethod[] = (
          data.methods || []
        ).map((m: { id: string }) => {
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
        setEnabledPayments(["cash", "qris", "transfer"]);
      }
    };
    fetchPayments();
  }, []);

  const resolveProductId = (item: CartItem) => {
    if (item.productId) return String(item.productId);
    return String(item.id).replace(/-(small|medium|large)$/i, "");
  };

  const getValidPrice = (price: number | string | undefined): number => {
    if (typeof price === "number" && !isNaN(price)) return price;
    if (typeof price === "string") {
      const parsed = parseFloat(price);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
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
        is_preorder: isPreorder,
        scheduled_pickup_date: isPreorder ? pickupDate : undefined,
        scheduled_pickup_time: isPreorder ? pickupTime : undefined,
        voucher_id: appliedVoucher?.id,
        voucher_code: appliedVoucher?.code,
        voucher_discount: voucherDiscount,
      };

      const response = await apiClient.post("/customer/orders", orderData);

      if (response.data.success) {
        clearCart();
        setOrderSuccess(
          response.data.order.order_number || response.data.order.id
        );
      } else {
        setError(response.data.message || "Failed to place order");
      }
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Failed to place order. Please try again.")
      );
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
              Your order <span className="font-semibold">{orderSuccess}</span>{" "}
              has been placed successfully.
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
            <h1 className="text-2xl font-bold text-gray-900">
              Your cart is empty
            </h1>
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
            <div className="lg:col-span-2 space-y-6">
              <OrderItemsSummary
                items={items}
                formatCurrency={formatCurrency}
              />

              <PaymentMethodSelector
                selected={paymentMethod}
                onSelect={setPaymentMethod}
                enabledMethods={enabledPayments}
              />

              <PreorderScheduler
                isEnabled={isPreorder}
                onToggle={setIsPreorder}
                pickupDate={pickupDate}
                onDateChange={setPickupDate}
                pickupTime={pickupTime}
                onTimeChange={setPickupTime}
              />

              <div className="rounded-3xl bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-green-600" />
                  Kode Voucher
                </h2>
                <VoucherInput
                  voucherCode={voucherCode}
                  onCodeChange={setVoucherCode}
                  isLoading={voucherLoading}
                  error={voucherError}
                  appliedVoucher={appliedVoucher}
                  onApply={() => applyVoucher(cartTotal)}
                  onRemove={removeVoucher}
                  formatCurrency={formatCurrency}
                  showLabel={false}
                />
              </div>

              <SpecialInstructions value={notes} onChange={setNotes} />

              {isAuthenticated && user && (
                <ContactInfo name={user.full_name} email={user.email} />
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <CartSummary
                  subtotal={cartTotal}
                  tax={tax}
                  discount={voucherDiscount}
                  onCheckout={handleSubmitOrder}
                  isCheckoutDisabled={
                    isSubmitting ||
                    !isAuthenticated ||
                    (isPreorder && (!pickupDate || !pickupTime))
                  }
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
                    <Link
                      href="/login?redirect=/checkout"
                      className="font-medium hover:underline"
                    >
                      Login
                    </Link>{" "}
                    to place your order
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
