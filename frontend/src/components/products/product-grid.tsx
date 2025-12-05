/**
 * Product grid component with filtering
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ProductCard, type Product } from "./product-card";
import { ProductGridSkeleton } from "@/components/ui/skeleton";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  className?: string;
  emptyMessage?: string;
  onAddToCart?: (product: Product, quantity: number, size: string) => void;
}

export function ProductGrid({
  products,
  isLoading = false,
  className,
  emptyMessage = "No products found",
  onAddToCart,
}: ProductGridProps) {
  if (isLoading) {
    return <ProductGridSkeleton count={8} className={className} />;
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 text-6xl" aria-hidden="true">
          🔍
        </div>
        <h3 className="text-xl font-semibold text-gray-900">
          {emptyMessage}
        </h3>
        <p className="mt-2 text-gray-500">
          Try adjusting your filters or search query.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
      role="list"
      aria-label="Products"
    >
      {products.map((product) => (
        <div key={product.id} role="listitem">
          <ProductCard product={product} onAddToCart={onAddToCart} />
        </div>
      ))}
    </div>
  );
}

export default ProductGrid;
