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
  User,
  ChefHat,
  Utensils,
  CupSoda,
  LayoutGrid,
  ClipboardList
} from "lucide-react";
import { posProductsApi, cashierOrdersApi } from "@/lib/api/index";
import { getImageUrl } from "@/lib/image-utils";
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

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-7rem)] gap-4 sm:gap-6">
      {/* Products Section */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-stone-200">
        {/* Header & Filters */}
        <div className="p-4 sm:p-6 border-b border-stone-100 bg-white z-10">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-serif font-bold text-stone-900">Katalog Produk</h1>
              <p className="text-xs sm:text-sm text-stone-500">Pilih kategori untuk mempercepat pencarian</p>
            </div>
            
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-stone-200 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-stone-50"
              />
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap border ${
                selectedCategory === "all"
                  ? "bg-stone-900 text-white border-stone-900 shadow-md"
                  : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50 hover:border-stone-300"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              All
            </button>
            {categories
              .filter(cat => cat.id !== 'all' && cat.name.toLowerCase() !== 'all') // Filter out duplicate "All" from API
              .map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap border ${
                  selectedCategory === cat.id
                    ? "bg-stone-900 text-white border-stone-900 shadow-md"
                    : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50 hover:border-stone-300"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50/50">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
                <p className="mt-2 text-stone-500">Memuat produk...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
                <h2 className="mt-4 text-lg font-semibold text-stone-900">{error}</h2>
                <button
                  onClick={() => fetchProducts()}
                  className="mt-4 rounded-full bg-emerald-600 px-6 py-2 text-white hover:bg-emerald-700 transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredProducts.map((product) => {
                  // Image selection logic matching ProductCard component
                  const productImage = product.thumbnail_image || product.bottle_image || product.hero_image || product.image_url || product.image;
                  const hasImage = !!productImage && !productImage.startsWith("bg-");
                  
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={!product.is_available}
                      className="group flex flex-col rounded-2xl bg-white p-3 sm:p-4 shadow-sm border border-stone-100 transition-all hover:shadow-md hover:border-emerald-200 disabled:opacity-50 disabled:hover:shadow-sm text-left"
                    >
                      <div 
                        className="mb-3 flex aspect-square w-full items-center justify-center rounded-xl relative overflow-hidden"
                        style={{ backgroundColor: product.image_color || "#f5f5f4" }}
                      >
                        {hasImage ? (
                          <img 
                            src={getImageUrl(productImage)} 
                            alt={product.name}
                            className="w-full h-full object-cover transform transition-transform group-hover:scale-110 duration-300"
                            onError={(e) => {
                              // Fallback if image fails to load
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        
                        {/* Fallback Icon (shown if no image or if image error) */}
                        <div className={`flex items-center justify-center w-full h-full absolute inset-0 ${hasImage ? 'hidden' : ''}`}>
                          <CupSoda className="w-12 h-12 text-stone-400/50 transform transition-transform group-hover:scale-110 duration-300" />
                        </div>
                        
                        {!product.is_available && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm z-10">
                            <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold border border-rose-200">Habis</span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-bold text-stone-900 line-clamp-1 text-sm sm:text-base mb-1">{product.name}</h3>
                      <div className="mt-auto flex items-center justify-between w-full">
                        <p className="font-mono font-semibold text-emerald-600 text-sm sm:text-base">
                          {formatCurrency(product.price || product.base_price || 0)}
                        </p>
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 group-hover:bg-stone-900 group-hover:text-white transition-colors">
                          <Plus size={14} className="sm:w-4 sm:h-4" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {filteredProducts.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center text-stone-500 p-8">
                  <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-stone-400" />
                  </div>
                  <p className="font-medium">Produk tidak ditemukan</p>
                  <p className="text-sm mt-1">Coba kata kunci atau kategori lain</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-full lg:w-96 flex flex-col rounded-2xl sm:rounded-[2.5rem] bg-white shadow-sm border border-stone-200 overflow-hidden shrink-0 h-[50vh] lg:h-auto">
        <div className="p-4 sm:p-6 border-b border-stone-100 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-serif font-bold text-stone-900">
              <ShoppingCart className="h-5 w-5" />
              Keranjang
            </h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs font-medium text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors"
              >
                Hapus Semua
              </button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50/30">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-stone-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 opacity-50" />
              </div>
              <div className="text-center">
                <p className="font-medium text-stone-600">Keranjang kosong</p>
                <p className="text-xs mt-1">Pilih produk di sebelah kiri</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={`${item.product_id}-${item.size}`} className="flex items-start gap-3 rounded-2xl bg-white p-3 shadow-sm border border-stone-100 group">
                  <div 
                    className="flex h-16 w-16 items-center justify-center rounded-xl shrink-0"
                    style={{ backgroundColor: item.image_color || "#f5f5f4" }}
                  >
                    {/* Replaced emoji with icon */}
                    <CupSoda className="h-8 w-8 text-stone-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-stone-900 line-clamp-1 text-sm">{item.name}</h4>
                      <button
                        onClick={() => removeFromCart(item.product_id, item.size)}
                        className="text-stone-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs font-mono text-stone-500 mb-2">{formatCurrency(item.price)}</p>
                    
                    <div className="flex items-center gap-3 bg-stone-100 w-fit rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.size, -1)}
                        className="w-6 h-6 rounded-md bg-white shadow-sm flex items-center justify-center text-stone-600 hover:text-stone-900 text-xs"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.size, 1)}
                        className="w-6 h-6 rounded-md bg-white shadow-sm flex items-center justify-center text-stone-600 hover:text-stone-900 text-xs"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Info & Payment */}
        <div className="border-t border-stone-100 bg-white p-4 sm:p-6 shadow-lg shadow-stone-200/50 z-20">
          {cart.length > 0 && (
            <div className="space-y-4 mb-4">
              {/* Toggle Customer Info */}
              <details className="group">
                <summary className="list-none flex items-center gap-2 text-xs font-medium text-stone-500 cursor-pointer hover:text-stone-800">
                  <User className="h-3.5 w-3.5" />
                  <span>Info Pelanggan & Pembayaran (Opsional)</span>
                  <span className="ml-auto transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="mt-3 space-y-3 pt-3 border-t border-dashed border-stone-200 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nama pelanggan"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none bg-stone-50"
                    />
                    <input
                      type="tel"
                      placeholder="No. telepon"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none bg-stone-50"
                    />
                  </div>
                  
                  <div>
                     <p className="text-xs text-stone-500 mb-2">Metode Pembayaran</p>
                     <div className="grid grid-cols-3 gap-2">
                      {[{id: 'cash', label: 'Tunai', icon: Banknote}, {id: 'qris', label: 'QRIS', icon: Smartphone}, {id: 'transfer', label: 'Transfer', icon: CreditCard}].map((method) => (
                         <button
                          key={method.id}
                          onClick={() => setPaymentMethod(method.id as any)}
                          className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-all ${
                            paymentMethod === method.id
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50"
                          }`}
                        >
                          <method.icon className="h-4 w-4" />
                          <span className="text-[10px] font-medium">{method.label}</span>
                        </button>
                      ))}
                     </div>
                  </div>
                  
                  <textarea
                    placeholder="Catatan pesanan..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-none bg-stone-50 resize-none"
                    rows={2}
                  />
                </div>
              </details>
              
              <div className="space-y-1 text-sm pt-2 border-t border-dashed border-stone-200">
                <div className="flex justify-between text-stone-500 text-xs">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-500 text-xs">
                  <span>Pajak (10%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-900 pt-1">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleSubmitOrder}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full rounded-xl bg-stone-900 py-3.5 font-bold text-white hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-stone-900 transition-colors shadow-lg shadow-stone-900/10 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <span className="text-sm">Bayar & Proses</span>
                <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                  {cart.length === 0 ? formatCurrency(0) : formatCurrency(total)}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && orderResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-500 p-6 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-3 shadow-lg">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Order Berhasil!</h3>
                <p className="text-emerald-100 text-sm">Terima kasih telah berbelanja</p>
              </div>
              <button
                onClick={() => setShowReceipt(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Receipt Content */}
            <div className="p-6 bg-stone-50">
              <div ref={receiptRef} className="bg-white p-4 rounded-xl shadow-sm border border-stone-100 text-sm">
                <div className="text-center mb-4">
                  <h2 className="font-bold text-lg">🍹 JuiceQu</h2>
                  <p className="text-stone-500 text-xs">Fresh & Healthy Juice</p>
                </div>
                
                <div className="border-b border-dashed border-stone-200 pb-3 mb-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-stone-500 text-xs">No. Order</span>
                    <span className="font-mono font-medium">{orderResult.order_number}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-stone-500 text-xs">Waktu</span>
                    <span className="text-xs">{formatTime(orderResult.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 text-xs">Metode</span>
                    <span className="capitalize text-xs font-medium">{orderResult.payment_method}</span>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {orderResult.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span>
                        <span className="font-bold">{item.quantity}x</span> {item.product_name}
                      </span>
                      <span className="font-mono">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-dashed border-stone-200 pt-3 space-y-1">
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(orderResult.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-stone-500">
                    <span>Pajak</span>
                    <span>{formatCurrency(orderResult.tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-stone-900 pt-1">
                    <span>Total</span>
                    <span>{formatCurrency(orderResult.total)}</span>
                  </div>
                </div>
                
                <div className="mt-4 text-center text-[10px] text-stone-400">
                  <p>Simpan struk ini sebagai bukti pembayaran.</p>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="p-4 bg-white border-t border-stone-100 flex gap-3">
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 rounded-xl border border-stone-200 py-3 font-bold text-stone-600 hover:bg-stone-50 transition-colors text-sm"
              >
                Tutup
              </button>
              <button
                onClick={handlePrintReceipt}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 font-bold text-white hover:bg-emerald-600 transition-colors text-sm shadow-lg shadow-stone-900/10"
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
