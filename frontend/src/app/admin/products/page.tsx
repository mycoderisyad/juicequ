"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Edit2, Trash2, Package, AlertCircle, Loader2, MoreHorizontal, FileUp, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductModal, DeleteModal, ImportExportModal } from "@/components/admin";
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
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
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

  const handleOpenImportExport = () => {
    setIsImportExportModalOpen(true);
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
    isImportExportModalOpen,
    setIsImportExportModalOpen,
    selectedProduct,
    handleCreate,
    handleEdit,
    handleDeleteClick,
    handleOpenImportExport,
    handleSave,
    handleDelete,
    handleToggleAvailability,
  };
}

function ProductsHeader({ onCreate, onImportExport }: { onCreate: () => void; onImportExport: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-800">Products</h1>
        <p className="text-stone-500 text-sm">Kelola katalog produk kamu</p>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={onImportExport} 
          className="flex items-center gap-2 bg-white text-stone-700 px-5 py-3 rounded-full border border-stone-200 hover:bg-stone-50 hover:border-stone-300 transition-colors font-medium"
        >
          <FileUp size={18} />
          Import / Export
        </button>
        <button 
          onClick={onCreate} 
          className="flex items-center gap-2 bg-stone-900 text-white px-5 py-3 rounded-full hover:bg-emerald-600 transition-colors font-medium"
        >
          <Plus size={18} />
          Tambah Produk
        </button>
      </div>
    </div>
  );
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-rose-600 border border-rose-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">{message}</span>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-rose-400 hover:text-rose-600 text-xl font-bold">×</button>
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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
        <input
          type="text"
          placeholder="Cari produk..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-white border border-stone-200 rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </div>
      <select
        value={categoryFilter}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="bg-white border border-stone-200 text-stone-600 text-sm rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
      >
        <option value="">Semua Kategori</option>
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
    <tr className="hover:bg-stone-50/50 transition-colors group">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-2xl ${product.image_color || product.image || "bg-emerald-100"} shrink-0`} />
          <div>
            <p className="font-semibold text-stone-800">{product.name}</p>
            <p className="text-sm text-stone-400 line-clamp-1">{product.description}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="bg-stone-100 text-stone-600 px-3 py-1 rounded-full text-xs font-medium">
          {categoryName}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="font-semibold text-stone-800">
          Rp {(product.price || product.base_price || 0).toLocaleString("id-ID")}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className={`font-semibold ${(product.stock ?? 0) < 10 ? "text-rose-600" : "text-stone-700"}`}>
          {product.stock ?? 0}
        </span>
      </td>
      <td className="px-6 py-4">
        <button onClick={onToggle} className="focus:outline-none">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            product.is_available 
              ? "bg-emerald-50 text-emerald-600" 
              : "bg-stone-100 text-stone-500"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${product.is_available ? "bg-emerald-500" : "bg-stone-400"}`}></span>
            {product.is_available ? "Available" : "Unavailable"}
          </span>
        </button>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onEdit} 
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={onDelete} 
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <Trash2 size={16} />
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
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-4">
          <Package className="h-10 w-10 text-stone-300" />
        </div>
        <h3 className="text-lg font-serif font-bold text-stone-800">Belum ada produk</h3>
        <p className="text-stone-500 mb-6">Mulai dengan menambahkan produk pertama</p>
        <button 
          onClick={onCreate} 
          className="flex items-center gap-2 bg-stone-900 text-white px-5 py-3 rounded-full hover:bg-emerald-600 transition-colors font-medium"
        >
          <Plus size={18} />
          Tambah Produk
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-stone-100">
            <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-wider">Produk</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-wider">Kategori</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-wider">Harga</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-wider">Stok</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-stone-400 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
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
    </div>
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
      <ProductsHeader onCreate={modalsState.handleCreate} onImportExport={modalsState.handleOpenImportExport} />
      {combinedError && <ErrorBanner message={combinedError} onDismiss={clearError} />}
      <ProductsFilter
        searchQuery={productsState.searchQuery}
        onSearchChange={productsState.setSearchQuery}
        categoryFilter={productsState.categoryFilter}
        onCategoryChange={productsState.setCategoryFilter}
        categories={productsState.categories}
      />
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-200 overflow-hidden">
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
      <ImportExportModal
        isOpen={modalsState.isImportExportModalOpen}
        onClose={() => modalsState.setIsImportExportModalOpen(false)}
        onImportSuccess={productsState.refetch}
      />
    </div>
  );
}
