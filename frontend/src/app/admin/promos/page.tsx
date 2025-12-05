"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Percent,
  Calendar,
  Package,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store";

interface ProductPromo {
  id: string;
  product_id: number;
  name: string;
  description: string | null;
  promo_type: "percentage" | "fixed";
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_valid: boolean;
  discount_display: string;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: number;
  name: string;
  base_price: number;
}

export default function PromosPage() {
  const [promos, setPromos] = useState<ProductPromo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<ProductPromo | null>(null);
  const { token } = useAuthStore();

  // Form state
  const [formData, setFormData] = useState({
    product_id: "",
    name: "",
    description: "",
    promo_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  const fetchPromos = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/admin/promos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch promos");
      const data = await res.json();
      setPromos(data.items || []);
    } catch {
      setError("Gagal memuat data promo");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data.items || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchPromos();
    fetchProducts();
  }, [fetchPromos, fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPromo 
        ? `/api/v1/admin/promos/${editingPromo.id}`
        : "/api/v1/admin/promos";
      
      const res = await fetch(url, {
        method: editingPromo ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          product_id: parseInt(formData.product_id),
          discount_value: parseFloat(formData.discount_value),
          start_date: new Date(formData.start_date).toISOString(),
          end_date: new Date(formData.end_date).toISOString(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to save promo");
      }

      setShowModal(false);
      resetForm();
      fetchPromos();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save promo");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus promo ini?")) return;
    try {
      const res = await fetch(`/api/v1/admin/promos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      fetchPromos();
    } catch {
      alert("Gagal menghapus promo");
    }
  };

  const handleToggleActive = async (promo: ProductPromo) => {
    try {
      const res = await fetch(`/api/v1/admin/promos/${promo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !promo.is_active }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update");
      }
      fetchPromos();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: "",
      name: "",
      description: "",
      promo_type: "percentage",
      discount_value: "",
      start_date: "",
      end_date: "",
      is_active: true,
    });
    setEditingPromo(null);
  };

  const openEditModal = (promo: ProductPromo) => {
    setEditingPromo(promo);
    setFormData({
      product_id: promo.product_id.toString(),
      name: promo.name,
      description: promo.description || "",
      promo_type: promo.promo_type,
      discount_value: promo.discount_value.toString(),
      start_date: promo.start_date.slice(0, 16),
      end_date: promo.end_date.slice(0, 16),
      is_active: promo.is_active,
    });
    setShowModal(true);
  };

  const getProductName = (productId: number) => {
    return products.find(p => p.id === productId)?.name || `Product #${productId}`;
  };

  const filteredPromos = promos.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getProductName(p.product_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Promo Produk</h1>
          <p className="text-stone-500">Kelola diskon per produk</p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Promo
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input
          placeholder="Cari promo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
          <Button variant="ghost" size="sm" onClick={fetchPromos}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-stone-600">Produk</th>
                <th className="text-left py-4 px-6 font-semibold text-stone-600">Nama Promo</th>
                <th className="text-left py-4 px-6 font-semibold text-stone-600">Diskon</th>
                <th className="text-left py-4 px-6 font-semibold text-stone-600">Periode</th>
                <th className="text-left py-4 px-6 font-semibold text-stone-600">Status</th>
                <th className="text-right py-4 px-6 font-semibold text-stone-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Memuat...
                  </td>
                </tr>
              ) : filteredPromos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    <Percent className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                    Belum ada promo
                  </td>
                </tr>
              ) : (
                filteredPromos.map((promo) => (
                  <tr key={promo.id} className="hover:bg-stone-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-stone-400" />
                        <span className="font-medium">{getProductName(promo.product_id)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">{promo.name}</td>
                    <td className="py-4 px-6">
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-sm font-medium">
                        {promo.discount_display}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-stone-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(promo.start_date).toLocaleDateString("id-ID")} - {new Date(promo.end_date).toLocaleDateString("id-ID")}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleActive(promo)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          promo.is_active && promo.is_valid
                            ? "bg-emerald-100 text-emerald-700"
                            : promo.is_active
                            ? "bg-amber-100 text-amber-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {promo.is_active ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                        {promo.is_active && promo.is_valid ? "Aktif" : promo.is_active ? "Kadaluarsa" : "Nonaktif"}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(promo)}
                          className="p-2 hover:bg-stone-100 rounded-lg text-stone-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-stone-200">
              <h2 className="text-xl font-bold text-stone-900">
                {editingPromo ? "Edit Promo" : "Tambah Promo Baru"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Product */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Produk</label>
                <select
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  required
                  disabled={!!editingPromo}
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Pilih produk...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} - Rp {p.base_price.toLocaleString("id-ID")}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nama Promo</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Diskon Akhir Tahun"
                  required
                  className="rounded-xl"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Deskripsi (opsional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Promo Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Tipe Diskon</label>
                  <select
                    value={formData.promo_type}
                    onChange={(e) => setFormData({ ...formData, promo_type: e.target.value as "percentage" | "fixed" })}
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Potongan (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    {formData.promo_type === "percentage" ? "Diskon (%)" : "Potongan (Rp)"}
                  </label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.promo_type === "percentage" ? "20" : "5000"}
                    required
                    min="0"
                    max={formData.promo_type === "percentage" ? "100" : undefined}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Mulai</label>
                  <Input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Selesai</label>
                  <Input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Active */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="is_active" className="text-sm text-stone-700">Aktifkan promo</label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="flex-1 rounded-xl"
                >
                  Batal
                </Button>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-xl">
                  {editingPromo ? "Simpan" : "Tambah"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
