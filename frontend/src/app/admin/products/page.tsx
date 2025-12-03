"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, Package, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductModal, DeleteModal } from "@/components/admin";
import { adminProductsApi, categoriesApi } from "@/lib/api/admin";

interface Product {
  id: number | string;
  name: string;
  description: string;
  price?: number;
  base_price?: number;
  category?: string;
  category_id?: string;
  image?: string;
  image_url?: string;
  image_color?: string;
  hero_image?: string;
  bottle_image?: string;
  thumbnail_image?: string;
  is_available: boolean;
  stock?: number;
  stock_quantity?: number;
  ingredients?: string[];
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await adminProductsApi.getAll({
        search: searchQuery || undefined,
        category: categoryFilter || undefined,
      });
      setProducts(response.products || []);
    } catch {
      setError("Failed to load products");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.categories || []);
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    categories,
    isLoading,
    error,
    setError,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    refetch: fetchProducts,
  };
}

function useProductModals(refetch: () => void) {
  const [isSaving, setIsSaving] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async (data: Partial<Product>) => {
    try {
      setIsSaving(true);
      if (selectedProduct) {
        await adminProductsApi.update(String(selectedProduct.id), data);
      } else {
        await adminProductsApi.create(data as { name: string; description: string; price: number; category: string });
      }
      setIsProductModalOpen(false);
      refetch();
    } catch {
      setError("Failed to save product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;
    try {
      setIsSaving(true);
      await adminProductsApi.delete(String(selectedProduct.id));
      setIsDeleteModalOpen(false);
      refetch();
    } catch {
      setError("Failed to delete product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      await adminProductsApi.update(String(product.id), { is_available: !product.is_available });
      refetch();
    } catch {
      // Silent
    }
  };

  return {
    isSaving,
    error,
    setError,
    isProductModalOpen,
    setIsProductModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    selectedProduct,
    handleCreate,
    handleEdit,
    handleDeleteClick,
    handleSave,
    handleDelete,
    handleToggleAvailability,
  };
}

function ProductsHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-500">Manage your product catalog</p>
      </div>
      <Button onClick={onCreate} className="bg-green-600 hover:bg-green-700">
        <Plus className="mr-2 h-4 w-4" />
        Add Product
      </Button>
    </div>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-600">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {message}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-red-400 hover:text-red-600">×</button>
        )}
      </div>
    </div>
  );
}

function ProductsFilter({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories,
}: {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  categoryFilter: string;
  onCategoryChange: (v: string) => void;
  categories: Category[];
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <select
        value={categoryFilter}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.icon} {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function ProductRow({
  product,
  categories,
  onEdit,
  onDelete,
  onToggle,
}: {
  product: Product;
  categories: Category[];
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const categoryName = categories.find((c) => c.id === (product.category || product.category_id))?.name || product.category;

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-lg ${product.image_color || product.image || "bg-gray-200"}`} />
          <div>
            <p className="font-medium text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <Badge variant="secondary">{categoryName}</Badge>
      </td>
      <td className="px-6 py-4 font-medium text-gray-900">
        Rp {(product.price || product.base_price || 0).toLocaleString("id-ID")}
      </td>
      <td className="px-6 py-4">
        <span className={`font-medium ${(product.stock ?? 0) < 10 ? "text-red-600" : "text-gray-900"}`}>
          {product.stock ?? 0}
        </span>
      </td>
      <td className="px-6 py-4">
        <button onClick={onToggle} className="focus:outline-none">
          <Badge variant={product.is_available ? "success" : "secondary"}>
            {product.is_available ? "Available" : "Unavailable"}
          </Badge>
        </button>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <button onClick={onEdit} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={onDelete} className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function ProductsTable({
  products,
  categories,
  isLoading,
  onCreate,
  onEdit,
  onDelete,
  onToggle,
}: {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  onCreate: () => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onToggle: (p: Product) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package className="mb-4 h-16 w-16 text-gray-300" />
        <h3 className="text-lg font-semibold text-gray-900">No products found</h3>
        <p className="text-gray-500">Get started by adding your first product</p>
        <Button onClick={onCreate} className="mt-4 bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Product</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Category</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Price</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Stock</th>
          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {products.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            categories={categories}
            onEdit={() => onEdit(product)}
            onDelete={() => onDelete(product)}
            onToggle={() => onToggle(product)}
          />
        ))}
      </tbody>
    </table>
  );
}

export default function AdminProductsPage() {
  const productsState = useProducts();
  const modalsState = useProductModals(productsState.refetch);

  const combinedError = productsState.error || modalsState.error;
  const clearError = () => {
    productsState.setError(null);
    modalsState.setError(null);
  };

  return (
    <div>
      <ProductsHeader onCreate={modalsState.handleCreate} />
      {combinedError && <ErrorBanner message={combinedError} onDismiss={clearError} />}
      <ProductsFilter
        searchQuery={productsState.searchQuery}
        onSearchChange={productsState.setSearchQuery}
        categoryFilter={productsState.categoryFilter}
        onCategoryChange={productsState.setCategoryFilter}
        categories={productsState.categories}
      />
      <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
        <ProductsTable
          products={productsState.products}
          categories={productsState.categories}
          isLoading={productsState.isLoading}
          onCreate={modalsState.handleCreate}
          onEdit={modalsState.handleEdit}
          onDelete={modalsState.handleDeleteClick}
          onToggle={modalsState.handleToggleAvailability}
        />
      </div>
      <ProductModal
        isOpen={modalsState.isProductModalOpen}
        onClose={() => modalsState.setIsProductModalOpen(false)}
        product={modalsState.selectedProduct}
        categories={productsState.categories}
        onSave={modalsState.handleSave}
        isLoading={modalsState.isSaving}
      />
      <DeleteModal
        isOpen={modalsState.isDeleteModalOpen}
        onClose={() => modalsState.setIsDeleteModalOpen(false)}
        onConfirm={modalsState.handleDelete}
        itemName={modalsState.selectedProduct?.name || ""}
        isLoading={modalsState.isSaving}
      />
    </div>
  );
}
