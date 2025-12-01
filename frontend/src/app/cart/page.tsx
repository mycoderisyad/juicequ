"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCartStore();
  const { t } = useTranslation();
  const cartTotal = total();
  const tax = cartTotal * 0.1; // 10% tax
  const finalTotal = cartTotal + tax;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4">
          <h1 className="mb-8 text-3xl font-bold text-gray-900">{t("cart.title")}</h1>

          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-12 text-center shadow-sm">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <ShoppingBag className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{t("cart.empty.title")}</h2>
              <p className="mt-2 text-gray-500">{t("cart.empty.description")}</p>
              <Link href="/menu" className="mt-8">
                <Button className="rounded-full bg-green-600 px-8 py-6 text-lg hover:bg-green-700">
                  {t("cart.empty.startShopping")}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
                      {/* Image Placeholder */}
                      <div className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl ${item.color || 'bg-gray-100'}`}>
                        <div className="h-16 w-16 rounded-full bg-white/30 shadow-inner"></div>
                      </div>

                      <div className="flex flex-1 flex-col justify-between sm:flex-row sm:items-center">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                          <p className="text-green-600 font-medium">${item.price.toFixed(2)}</p>
                        </div>

                        <div className="mt-4 flex items-center gap-6 sm:mt-0">
                          <div className="flex items-center rounded-full border border-gray-200 bg-gray-50">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-2 text-gray-600 hover:text-gray-900"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-gray-900">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-2 text-gray-600 hover:text-gray-900"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <button 
                            onClick={() => removeItem(item.id)}
                            className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 rounded-3xl bg-white p-6 shadow-xl shadow-gray-200/50">
                  <h2 className="text-xl font-bold text-gray-900">{t("cart.summary.title")}</h2>
                  
                  <div className="mt-6 space-y-4 border-b border-gray-100 pb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>{t("cart.summary.subtotal")}</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>{t("cart.summary.tax")}</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>{t("cart.summary.deliveryFee")}</span>
                      <span className="text-green-600">{t("cart.summary.free")}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between text-lg font-bold text-gray-900">
                    <span>{t("cart.summary.total")}</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>

                  <Button className="mt-8 w-full rounded-full bg-green-600 py-6 text-lg hover:bg-green-700">
                    {t("cart.checkout")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  
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
