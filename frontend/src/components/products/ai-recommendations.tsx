"use client";

import { useState, useEffect } from "react";
import { Sparkles, ChevronRight, Loader2 } from "lucide-react";
import aiApi, { ProductRecommendation } from "@/lib/api/ai";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getImageUrl } from "@/lib/image-utils";

interface AIRecommendationsProps {
  preferences?: string;
  limit?: number;
  className?: string;
}

export function AIRecommendations({
  preferences,
  limit = 4,
  className = "",
}: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await aiApi.getRecommendations(preferences, limit);
        setRecommendations(response.recommendations);
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
        setError("Failed to load recommendations");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [preferences, limit]);

  if (isLoading) {
    return (
      <div className={`rounded-2xl bg-linear-to-r from-green-50 to-emerald-50 p-6 ${className}`}>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null;
  }

  return (
    <div className={`rounded-2xl bg-linear-to-r from-green-50 to-emerald-50 p-6 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recommended for You</h3>
        </div>
        <Link href="/menu">
          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {recommendations.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group overflow-hidden rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            {product.image_url && (
              <div className="relative mb-3 aspect-square overflow-hidden rounded-lg">
                <img
                  src={getImageUrl(product.image_url)}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            )}
            <h4 className="mb-1 font-medium text-gray-900 group-hover:text-green-600">
              {product.name}
            </h4>
            <p className="mb-2 text-sm text-gray-500 line-clamp-2">
              {product.reason}
            </p>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-green-600">
                Rp {product.base_price.toLocaleString("id-ID")}
              </span>
              {product.calories && (
                <span className="text-xs text-gray-400">
                  {product.calories} kcal
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default AIRecommendations;
