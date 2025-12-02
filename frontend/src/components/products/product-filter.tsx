/**
 * Product filter component
 */
"use client";

import * as React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface ProductFilters {
  search: string;
  category: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "name" | "price_asc" | "price_desc" | "popular";
}

interface ProductFilterProps {
  categories: Category[];
  filters: ProductFilters;
  onFilterChange: (filters: ProductFilters) => void;
  className?: string;
}

export function ProductFilter({
  categories,
  filters,
  onFilterChange,
  className,
}: ProductFilterProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value });
  };

  const handleCategoryChange = (categoryId: string) => {
    onFilterChange({ ...filters, category: categoryId });
  };

  const handlePriceChange = (min?: number, max?: number) => {
    onFilterChange({ ...filters, minPrice: min, maxPrice: max });
  };

  const handleClearFilters = () => {
    onFilterChange({
      search: "",
      category: "all",
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: undefined,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.category !== "all" ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Main Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="relative w-full max-w-md">
          <Search
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-12"
            aria-label="Search products"
          />
          {filters.search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Advanced Filter Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            aria-expanded={showAdvanced}
            aria-controls="advanced-filters"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 md:pb-0"
        role="tablist"
        aria-label="Product categories"
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-6 py-2 text-sm font-medium transition-colors",
              filters.category === category.id
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            role="tab"
            aria-selected={filters.category === category.id}
            aria-controls="product-list"
          >
            {category.icon && (
              <span aria-hidden="true">{category.icon}</span>
            )}
            {category.name}
          </button>
        ))}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div
          id="advanced-filters"
          className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Price Range */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Min Price
              </label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={filters.minPrice ?? ""}
                onChange={(e) =>
                  handlePriceChange(
                    e.target.value ? parseFloat(e.target.value) : undefined,
                    filters.maxPrice
                  )
                }
                placeholder="$0"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Max Price
              </label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={filters.maxPrice ?? ""}
                onChange={(e) =>
                  handlePriceChange(
                    filters.minPrice,
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                placeholder="$100"
              />
            </div>

            {/* Sort By */}
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Sort By
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: undefined, label: "Default" },
                  { value: "name" as const, label: "Name" },
                  { value: "price_asc" as const, label: "Price: Low to High" },
                  { value: "price_desc" as const, label: "Price: High to Low" },
                  { value: "popular" as const, label: "Most Popular" },
                ].map((option) => (
                  <button
                    key={option.label}
                    onClick={() =>
                      onFilterChange({ ...filters, sortBy: option.value })
                    }
                    className={cn(
                      "rounded-full px-3 py-1 text-sm transition-colors",
                      filters.sortBy === option.value
                        ? "bg-green-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductFilter;
