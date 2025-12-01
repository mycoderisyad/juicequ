"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { menuItems } from "@/lib/data";
import Link from "next/link";

export default function ProductPage() {
  const params = useParams();
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  
  // Find product
  const idParam = params?.id;
  const idString = Array.isArray(idParam) ? idParam[0] : idParam;
  const id = idString ? parseInt(idString) : null;
  const product = menuItems.find(item => item.id === id);

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center p-10">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
          <Link href="/menu" className="mt-4 text-green-600 hover:underline">
            Back to Menu
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      color: product.color,
      quantity: quantity
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4">
          <Link href="/menu" className="mb-8 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Link>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
            {/* Product Image */}
            <div className="relative aspect-square overflow-hidden rounded-[3rem] bg-gray-50">
               <div className={`absolute inset-0 ${product.color} opacity-20`}></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className={`h-64 w-64 rounded-full ${product.color} opacity-80 shadow-2xl shadow-${product.color}/50`}></div>
               </div>
            </div>

            {/* Product Details */}
            <div className="flex flex-col justify-center">
              <div className="mb-6">
                <h1 className="mb-2 text-4xl font-bold text-gray-900">{product.name}</h1>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-green-600">${product.price}</span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                    {product.calories} cal
                  </span>
                </div>
              </div>

              <p className="mb-8 text-lg leading-relaxed text-gray-600">
                {product.description}
              </p>

              {/* Ingredients (Mock) */}
              <div className="mb-8">
                <h3 className="mb-3 font-semibold text-gray-900">Ingredients</h3>
                <div className="flex flex-wrap gap-2">
                  {["Organic", "Gluten-Free", "Vegan", "Non-GMO"].map((tag) => (
                    <span key={tag} className="rounded-full border border-gray-200 px-4 py-1 text-sm text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center rounded-full border border-gray-200 bg-gray-50 p-1">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm transition-colors hover:text-gray-900"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-semibold text-gray-900">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-sm transition-colors hover:text-gray-900"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <Button 
                  onClick={handleAddToCart}
                  className="h-12 flex-1 rounded-full bg-gray-900 text-lg font-medium text-white hover:bg-gray-800"
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Add to Cart - ${(parseFloat(product.price) * quantity).toFixed(2)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
