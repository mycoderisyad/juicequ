"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/hooks/use-store";
import {
  useVoucher,
  VoucherInput,
  CartItemCard,
} from "@/features/cart";

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCartStore();
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();

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

  const handleApplyVoucher = () => applyVoucher(cartTotal);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main id="main-content" className="flex-1 py-10">
        <div className="container mx-auto px-4">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">
            {t("cart.title")}
          </h1>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-12 text-center shadow-sm">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <ShoppingBag className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t("cart.empty.title")}
              </h2>
              <p className="mt-2 text-gray-500">{t("cart.empty.description")}</p>
              <Link href="/menu" className="mt-8">
                <Button className="rounded-full bg-green-600 px-8 py-6 text-lg hover:bg-green-700">
                  {t("cart.empty.startShopping")}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItemCard
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      price={item.price}
                      quantity={item.quantity}
                      image={item.image}
                      color={item.color}
                      volume={item.volume}
                      volumeUnit={item.volumeUnit}
                      formatCurrency={formatCurrency}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-24 rounded-3xl bg-white p-6 shadow-xl shadow-gray-200/50">
                  <h2 className="text-xl font-bold text-gray-900">
                    {t("cart.summary.title")}
                  </h2>

                  <div className="mt-6 border-b border-gray-100 pb-6">
                    <VoucherInput
                      voucherCode={voucherCode}
                      onCodeChange={setVoucherCode}
                      isLoading={voucherLoading}
                      error={voucherError}
                      appliedVoucher={appliedVoucher}
                      onApply={handleApplyVoucher}
                      onRemove={removeVoucher}
                      formatCurrency={formatCurrency}
                    />
                  </div>

                  <div className="mt-6 space-y-4 border-b border-gray-100 pb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>{t("cart.summary.subtotal")}</span>
                      <span>{formatCurrency(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>{t("cart.summary.tax")}</span>
                      <span>{formatCurrency(tax)}</span>
                    </div>
                    {appliedVoucher && (
                      <div className="flex justify-between text-green-600">
                        <span>Diskon Voucher</span>
                        <span>-{formatCurrency(voucherDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600">
                      <span>{t("cart.summary.deliveryFee")}</span>
                      <span className="text-green-600">
                        {t("cart.summary.free")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between text-lg font-bold text-gray-900">
                    <span>{t("cart.summary.total")}</span>
                    <span>{formatCurrency(finalTotal)}</span>
                  </div>

                  <Link href="/checkout">
                    <Button className="mt-8 w-full rounded-full bg-green-600 py-6 text-lg hover:bg-green-700">
                      {t("cart.checkout")}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>

                  <p className="mt-4 text-center text-xs text-gray-400">
                    {t("cart.secureCheckout")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
