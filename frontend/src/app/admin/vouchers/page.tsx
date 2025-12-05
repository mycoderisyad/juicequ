"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Ticket,
  Calendar,
  Users,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/store";

interface Voucher {
  id: string;
  code: string;
  name: string;
  description: string | null;
  voucher_type: "percentage" | "fixed" | "free_shipping";
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_valid: boolean;
  usage_remaining: number | null;
  discount_display: string;
  created_at: string;
  updated_at: string;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { token } = useAuthStore();

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    voucher_type: "percentage" as "percentage" | "fixed" | "free_shipping",
    discount_value: "",
    min_order_amount: "0",
    max_discount: "",
    usage_limit: "",
    per_user_limit: "1",
    start_date: "",
    end_date: "",
    is_active: true,
  });

  const fetchVouchers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/v1/admin/vouchers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch vouchers");
      const data = await res.json();
      setVouchers(data.items || []);
    } catch {
      setError("Gagal memuat data voucher");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingVoucher 
        ? `/api/v1/admin/vouchers/${editingVoucher.id}`
        : "/api/v1/admin/vouchers";
      
      const payload = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || null,
        voucher_type: formData.voucher_type as "percentage" | "fixed_amount",
        discount_value: parseFloat(formData.discount_value) || 0,
        min_order_amount: parseFloat(formData.min_order_amount) || 0,
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        per_user_limit: parseInt(formData.per_user_limit) || 1,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        is_active: formData.is_active,
      };

      const res = await fetch(url, {
        method: editingVoucher ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to save voucher");
      }

      setShowModal(false);
      resetForm();
      fetchVouchers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to save voucher");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus voucher ini?")) return;
    try {
      const res = await fetch(`/api/v1/admin/vouchers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      fetchVouchers();
    } catch {
      alert("Gagal menghapus voucher");
    }
  };

  const handleToggleActive = async (voucher: Voucher) => {
    try {
      const res = await fetch(`/api/v1/admin/vouchers/${voucher.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !voucher.is_active }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to update");
      }
      fetchVouchers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      voucher_type: "percentage",
      discount_value: "",
      min_order_amount: "0",
      max_discount: "",
      usage_limit: "",
      per_user_limit: "1",
      start_date: "",
      end_date: "",
      is_active: true,
    });
    setEditingVoucher(null);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "JQ";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const openEditModal = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      name: voucher.name,
      description: voucher.description || "",
      voucher_type: voucher.voucher_type,
      discount_value: voucher.discount_value.toString(),
      min_order_amount: voucher.min_order_amount.toString(),
      max_discount: voucher.max_discount?.toString() || "",
      usage_limit: voucher.usage_limit?.toString() || "",
      per_user_limit: voucher.per_user_limit.toString(),
      start_date: voucher.start_date.slice(0, 16),
      end_date: voucher.end_date.slice(0, 16),
      is_active: voucher.is_active,
    });
    setShowModal(true);
  };

  const getVoucherTypeLabel = (type: string) => {
    switch (type) {
      case "percentage": return "Persentase";
      case "fixed": return "Potongan Tetap";
      case "free_shipping": return "Gratis Ongkir";
      default: return type;
    }
  };

  const filteredVouchers = vouchers.filter(v => 
    v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Voucher</h1>
          <p className="text-stone-500">Kelola kode voucher diskon</p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Voucher
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input
          placeholder="Cari voucher..."
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
          <Button variant="ghost" size="sm" onClick={fetchVouchers}>
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
                <th className="text-left py-4 px-6 font-semibold text-stone-600">Kode</th>
                <th className="text-left py-4 px-6 font-semibold text-stone-600">Nama</th>
                <th className="text-left py-4 px-6 font-semibold text-stone-600">Diskon</th>
                <th className="text-left py-4 px-6 font-semibold text-stone-600">Penggunaan</th>
                <th className="text-left py-4 px-6 font-semibold text-stone-600">Periode</th>
                <th className="text-left py-4 px-6 font-semibold text-stone-600">Status</th>
                <th className="text-right py-4 px-6 font-semibold text-stone-600">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Memuat...
                  </td>
                </tr>
              ) : filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-500">
                    <Ticket className="w-12 h-12 mx-auto mb-2 text-stone-300" />
                    Belum ada voucher
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-stone-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <code className="bg-stone-100 px-2 py-1 rounded font-mono text-sm font-bold">
                          {voucher.code}
                        </code>
                        <button
                          onClick={() => copyCode(voucher.code)}
                          className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-600"
                        >
                          {copiedCode === voucher.code ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium">{voucher.name}</div>
                        <div className="text-xs text-stone-400">{getVoucherTypeLabel(voucher.voucher_type)}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-sm font-medium">
                        {voucher.discount_display}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="w-3 h-3 text-stone-400" />
                        <span>{voucher.usage_count}</span>
                        {voucher.usage_limit && (
                          <span className="text-stone-400">/ {voucher.usage_limit}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-stone-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(voucher.start_date).toLocaleDateString("id-ID")} - {new Date(voucher.end_date).toLocaleDateString("id-ID")}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleActive(voucher)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          voucher.is_active && voucher.is_valid
                            ? "bg-emerald-100 text-emerald-700"
                            : voucher.is_active
                            ? "bg-amber-100 text-amber-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {voucher.is_active ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                        {voucher.is_active && voucher.is_valid ? "Aktif" : voucher.is_active ? "Kadaluarsa" : "Nonaktif"}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(voucher)}
                          className="p-2 hover:bg-stone-100 rounded-lg text-stone-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(voucher.id)}
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
                {editingVoucher ? "Edit Voucher" : "Tambah Voucher Baru"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Kode Voucher</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="DISKON20"
                    required
                    className="rounded-xl flex-1 font-mono uppercase"
                  />
                  <Button type="button" variant="outline" onClick={generateCode} className="rounded-xl">
                    Generate
                  </Button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Nama Voucher</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Diskon Tahun Baru"
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

              {/* Voucher Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Tipe Voucher</label>
                  <select
                    value={formData.voucher_type}
                    onChange={(e) => setFormData({ ...formData, voucher_type: e.target.value as "percentage" | "fixed" | "free_shipping" })}
                    className="w-full px-4 py-2 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Potongan Tetap (Rp)</option>
                    <option value="free_shipping">Gratis Ongkir</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    {formData.voucher_type === "percentage" ? "Diskon (%)" : formData.voucher_type === "fixed" ? "Potongan (Rp)" : "Nilai"}
                  </label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.voucher_type === "percentage" ? "20" : "10000"}
                    required={formData.voucher_type !== "free_shipping"}
                    disabled={formData.voucher_type === "free_shipping"}
                    min="0"
                    max={formData.voucher_type === "percentage" ? "100" : undefined}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Min Order & Max Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Min. Pembelian (Rp)</label>
                  <Input
                    type="number"
                    value={formData.min_order_amount}
                    onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                    placeholder="0"
                    min="0"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Maks. Diskon (Rp)</label>
                  <Input
                    type="number"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    placeholder="Tidak terbatas"
                    min="0"
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Usage Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Limit Penggunaan Total</label>
                  <Input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    placeholder="Tidak terbatas"
                    min="1"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Limit per User</label>
                  <Input
                    type="number"
                    value={formData.per_user_limit}
                    onChange={(e) => setFormData({ ...formData, per_user_limit: e.target.value })}
                    placeholder="1"
                    min="1"
                    required
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
                <label htmlFor="is_active" className="text-sm text-stone-700">Aktifkan voucher</label>
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
                  {editingVoucher ? "Simpan" : "Tambah"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
