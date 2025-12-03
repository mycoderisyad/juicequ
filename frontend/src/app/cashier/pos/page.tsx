/**
 * Cashier POS (Point of Sale) Page.
 * Create walk-in orders for customers who purchase directly at the store.
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Search, 
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Loader2,
  AlertCircle,
  Banknote,
  Smartphone,
  CreditCard,
  Printer,
  CheckCircle,
  X,
  User
} from "lucide-react";
import { posProductsApi, cashierOrdersApi } from "@/lib/api/index";
import type { Product } from "@/lib/api/customer";
import type { WalkInOrderItem, CreateWalkInOrderRequest } from "@/lib/api/cashier";

interface CartItemWithDetails extends WalkInOrderItem {
  name: string;
  price: number;
  image_color?: string;
}

interface OrderResult {
  order_number: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  created_at: string;
}

const TAX_RATE = 0.10; // 10%

export default function CashierPOSPage() {
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; icon: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Cart state
  const [cart, setCart] = useState<CartItemWithDetails[]>([]);
  
  // Order state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris" | "transfer">("cash");
  const [orderNotes, setOrderNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Receipt modal
  const [showReceipt, setShowReceipt] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setError(null);
      const [productsData, categoriesData] = await Promise.all([
        posProductsApi.getAll({ category: selectedCategory !== "all" ? selectedCategory : undefined }),
        posProductsApi.getCategories(),
      ]);
      setProducts(productsData.items);
      setCategories(categoriesData.categories);
    } catch (err) {
      console.error("Failed to load products:", err);
      setError("Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;

  // Add to cart
  const addToCart = (product: Product) => {
    const price = product.price || product.base_price || 0;
    const existingItem = cart.find(item => item.product_id === String(product.id) && item.size === "medium");
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.product_id === String(product.id) && item.size === "medium"
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: String(product.id),
        name: product.name,
        price: price,
        quantity: 1,
        size: "medium",
        image_color: product.image_color,
      }]);
    }
  };

  // Update quantity
  const updateQuantity = (productId: string, size: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product_id === productId && item.size === size) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // Remove from cart
  const removeFromCart = (productId: string, size: string) => {
    setCart(cart.filter(item => !(item.product_id === productId && item.size === size)));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setOrderNotes("");
  };

  // Submit order
  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    
    try {
      setIsSubmitting(true);
      
      const orderData: CreateWalkInOrderRequest = {
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          size: item.size,
          notes: item.notes,
        })),
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        payment_method: paymentMethod,
        notes: orderNotes || undefined,
      };
      
      const result = await cashierOrdersApi.createWalkIn(orderData);
      
      // Set order result for receipt
      setOrderResult({
        order_number: result.order.order_number || result.order.id,
        items: result.order.items?.map(item => ({
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.subtotal,
        })) || cart.map(item => ({
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.price * item.quantity,
        })),
        subtotal: result.order.subtotal || subtotal,
        tax: result.order.tax || tax,
        total: result.order.total || total,
        payment_method: paymentMethod,
        created_at: result.order.created_at || new Date().toISOString(),
      });
      
      setShowReceipt(true);
      clearCart();
    } catch (err) {
      console.error("Failed to create order:", err);
      alert("Gagal membuat order. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Print receipt
  const handlePrintReceipt = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${orderResult?.order_number}</title>
              <style>
                body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 20px; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
                .item { display: flex; justify-content: space-between; margin: 5px 0; }
                .total { font-weight: bold; font-size: 1.2em; }
                .footer { text-align: center; margin-top: 20px; font-size: 0.9em; }
              </style>
            </head>
            <body>
              ${receiptRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && product.is_available;
  });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-green-600" />
          <p className="mt-2 text-gray-500">Memuat produk...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900">{error}</h2>
          <button
            onClick={() => fetchProducts()}
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      {/* Products Section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
          <p className="text-gray-500">Buat pesanan untuk pelanggan walk-in</p>
        </div>

        {/* Search & Categories */}
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === "all"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3 pb-4 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={!product.is_available}
                className="group rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
              >
                <div 
                  className="mb-3 flex h-20 items-center justify-center rounded-lg"
                  style={{ backgroundColor: product.image_color || "#f3f4f6" }}
                >
                  <span className="text-3xl">🍹</span>
                </div>
                <h3 className="font-medium text-gray-900 line-clamp-1">{product.name}</h3>
                <p className="text-sm font-semibold text-green-600">
                  {formatCurrency(product.price || product.base_price || 0)}
                </p>
                {!product.is_available && (
                  <span className="mt-1 inline-block rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                    Habis
                  </span>
                )}
              </button>
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="py-12 text-center text-gray-500">
              Tidak ada produk yang ditemukan
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 flex flex-col rounded-xl bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <ShoppingCart className="h-5 w-5" />
              Keranjang
            </h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Hapus Semua
              </button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              <div className="text-center">
                <ShoppingCart className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2">Keranjang kosong</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={`${item.product_id}-${item.size}`} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                  <div 
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: item.image_color || "#e5e7eb" }}
                  >
                    <span className="text-xl">🍹</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 line-clamp-1">{item.name}</h4>
                    <p className="text-sm text-gray-500">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.size, -1)}
                      className="rounded bg-gray-200 p-1 hover:bg-gray-300"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.size, 1)}
                      className="rounded bg-gray-200 p-1 hover:bg-gray-300"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product_id, item.size)}
                      className="ml-1 rounded p-1 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Info & Payment */}
        {cart.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Customer Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                Info Pelanggan (Opsional)
              </div>
              <input
                type="text"
                placeholder="Nama pelanggan"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
              <input
                type="tel"
                placeholder="No. telepon"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Metode Pembayaran</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-colors ${
                    paymentMethod === "cash"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Banknote className="h-5 w-5 text-green-600" />
                  <span className="text-xs">Tunai</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("qris")}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-colors ${
                    paymentMethod === "qris"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Smartphone className="h-5 w-5 text-purple-600" />
                  <span className="text-xs">QRIS</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("transfer")}
                  className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-colors ${
                    paymentMethod === "transfer"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span className="text-xs">Transfer</span>
                </button>
              </div>
            </div>

            {/* Order Notes */}
            <textarea
              placeholder="Catatan order (opsional)"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              rows={2}
            />
          </div>
        )}

        {/* Summary & Checkout */}
        <div className="border-t bg-gray-50 p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Pajak (10%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          
          <button
            onClick={handleSubmitOrder}
            disabled={cart.length === 0 || isSubmitting}
            className="mt-4 w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            ) : (
              `Bayar ${formatCurrency(total)}`
            )}
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && orderResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-green-600">
                <CheckCircle className="h-5 w-5" />
                Order Berhasil!
              </h3>
              <button
                onClick={() => setShowReceipt(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Receipt Content */}
            <div ref={receiptRef} className="p-6">
              <div className="header text-center">
                <h2 className="text-xl font-bold">🍹 JuiceQu</h2>
                <p className="text-sm text-gray-500">Fresh & Healthy Juice</p>
              </div>
              
              <div className="divider my-4 border-t border-dashed border-gray-300" />
              
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-500">No. Order</span>
                <span className="font-mono font-medium">{orderResult.order_number}</span>
              </div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-500">Tanggal</span>
                <span>{formatTime(orderResult.created_at)}</span>
              </div>
              <div className="mb-4 flex justify-between text-sm">
                <span className="text-gray-500">Pembayaran</span>
                <span className="capitalize">{orderResult.payment_method}</span>
              </div>
              
              <div className="divider my-4 border-t border-dashed border-gray-300" />
              
              <div className="space-y-2">
                {orderResult.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.product_name}
                    </span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              
              <div className="divider my-4 border-t border-dashed border-gray-300" />
              
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(orderResult.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pajak</span>
                  <span>{formatCurrency(orderResult.tax)}</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(orderResult.total)}</span>
                </div>
              </div>
              
              <div className="footer mt-6 text-center text-sm text-gray-500">
                <p>Terima kasih telah berbelanja!</p>
                <p>Semoga hari Anda menyegarkan 🍹</p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 border-t p-4">
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2 font-medium text-gray-700 hover:bg-gray-50"
              >
                Tutup
              </button>
              <button
                onClick={handlePrintReceipt}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700"
              >
                <Printer className="h-4 w-4" />
                Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
