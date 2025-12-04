"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Minus, Plus, ArrowLeft, ShoppingBag, RefreshCw } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { productsApi, type Product as ApiProduct } from "@/lib/api/customer";
import { useCurrency } from "@/lib/hooks/use-store";
import { AIFotobooth } from "@/components/products";
import Link from "next/link";

interface DisplayProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  calories: number;
  category: string;
  color: string;
  ingredients?: string[];
  thumbnail_image?: string;
  hero_image?: string;
  bottle_image?: string;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

// Transform API product to display format
function transformProduct(product: ApiProduct): DisplayProduct {
  const priceValue = product.base_price || product.price || 0;
  return {
    id: String(product.id),
    name: product.name,
    description: product.description,
    price: priceValue.toString(),
    calories: product.calories || 0,
    category: product.category_id || product.category || "",
    color: product.image_color || product.image_url || "bg-green-500",
    ingredients: product.ingredients,
    thumbnail_image: product.thumbnail_image,
    hero_image: product.hero_image,
    bottle_image: product.bottle_image,
    nutrition: product.nutrition,
  };
}

export default function ProductPage() {
  const params = useParams();
  const { addItem } = useCartStore();
  const { format } = useCurrency();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<DisplayProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const idParam = params?.id;
  const idString = Array.isArray(idParam) ? idParam[0] : idParam;

  const fetchProduct = useCallback(async () => {
    if (!idString) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await productsApi.getById(idString);
      setProduct(transformProduct(response));
    } catch (err) {
      console.error("Failed to fetch product:", err);
      setError("Product not found or failed to load.");
    } finally {
      setIsLoading(false);
    }
  }, [idString]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = () => {
    if (!product) return;
    const productImage = product.thumbnail_image || product.bottle_image || product.hero_image;
    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      color: product.color,
      image: productImage,
      quantity: quantity
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex-1 py-10">
          <div className="container mx-auto px-4">
            <Skeleton className="mb-8 h-6 w-32" />
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
              <Skeleton className="aspect-square w-full rounded-[3rem]" />
              <div className="flex flex-col justify-center space-y-6">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Not found state
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

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4">
          {/* Error Banner */}
          {error && (
            <div className="mb-6 flex items-center justify-between rounded-xl bg-yellow-50 p-4 text-yellow-800">
              <span>{error}</span>
              <button
                onClick={fetchProduct}
                className="flex items-center gap-2 text-sm font-medium hover:underline"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          )}
          
          <Link href="/menu" className="mb-8 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Link>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
            {/* Product Image */}
            <div className="relative aspect-square overflow-hidden rounded-[3rem] bg-gray-50">
              {(product.thumbnail_image || product.bottle_image || product.hero_image) ? (
                <img
                  src={product.thumbnail_image || product.bottle_image || product.hero_image}
                  alt={product.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <>
                  <div className={`absolute inset-0 ${product.color} opacity-20`}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`h-64 w-64 rounded-full ${product.color} opacity-80 shadow-2xl`}></div>
                  </div>
                </>
              )}
            </div>

            {/* Product Details */}
            <div className="flex flex-col justify-center">
              <div className="mb-6">
                <h1 className="mb-2 text-4xl font-bold text-gray-900">{product.name}</h1>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-green-600">{format(parseInt(product.price))}</span>
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
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
                  className="h-12 flex-1 rounded-full bg-green-600 text-lg font-medium text-white hover:bg-green-700"
                >
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  Add to Cart - {format(parseFloat(product.price) * quantity)}
                </Button>
              </div>

              {/* AI Fotobooth Section */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <AIFotobooth productId={product.id} productName={product.name} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
