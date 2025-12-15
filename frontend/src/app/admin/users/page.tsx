"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Users as UsersIcon,
  AlertCircle,
  X,
  Check,
  Loader2,
  Shield,
  ShieldCheck,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usersApi } from "@/lib/api/admin";

interface UserData {
  id: string;
  email: string;
  nama: string;
  full_name?: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

// User Form Modal
function UserModal({
  isOpen,
  onClose,
  user,
  onSave,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  onSave: (data: Partial<UserData> & { password?: string }) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    email: "",
    nama: "",
    password: "",
    role: "pembeli",
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        nama: user.nama || user.full_name || "",
        password: "",
        role: user.role,
        is_active: user.is_active,
      });
    } else {
      setFormData({
        email: "",
        nama: "",
        password: "",
        role: "pembeli",
        is_active: true,
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<UserData> & { password?: string } = {
      email: formData.email,
      nama: formData.nama,
      role: formData.role,
      is_active: formData.is_active,
    };
    if (formData.password) {
      data.password = formData.password;
    }
    onSave(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-4xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-serif font-bold text-stone-800">
            {user ? "Edit User" : "Tambah User Baru"}
          </h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors">
            <X size={18} className="text-stone-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-600">
              Nama Lengkap *
            </label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="John Doe"
              required
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-600">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              required
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-600">
              Password {user ? "(kosongkan jika tidak diubah)" : "*"}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required={!user}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-600">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
              required
            >
              <option value="pembeli">Customer</option>
              <option value="kasir">Cashier</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-3 bg-stone-50 p-4 rounded-2xl">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded-lg border-stone-300 text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="is_active" className="text-sm text-stone-700 font-medium">
              Akun aktif
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="px-5 py-2.5 rounded-full bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Check size={16} />
                  {user ? "Update" : "Simpan"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  isLoading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-4xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-rose-600" />
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-800">Hapus User</h2>
        </div>
        <p className="mb-6 text-stone-600">
          Yakin ingin menghapus <strong>{userName}</strong>? Aksi ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-stone-200 text-stone-600 font-medium hover:bg-stone-50 transition-colors"
          >
            Batal
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isLoading}
            className="px-5 py-2.5 rounded-full bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Hapus
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const roleIcons: Record<string, React.ReactNode> = {
  admin: <ShieldCheck className="h-4 w-4" />,
  kasir: <Shield className="h-4 w-4" />,
  pembeli: <User className="h-4 w-4" />,
};

const roleColors: Record<string, string> = {
  admin: "bg-emerald-100 text-emerald-600",
  kasir: "bg-amber-100 text-amber-600",
  pembeli: "bg-stone-100 text-stone-600",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Modal states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await usersApi.getAll({
        search: searchQuery || undefined,
        role: roleFilter || undefined,
      });
      setUsers(response.users || []);
    } catch {
      setError("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleDeleteClick = (user: UserData) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleSaveUser = async (data: Partial<UserData> & { password?: string }) => {
    try {
      setIsSaving(true);
      if (selectedUser) {
        await usersApi.update(selectedUser.id, data);
      } else {
        await usersApi.create(data as {
          email: string;
          nama: string;
          password: string;
          role?: string;
        });
      }
      setIsUserModalOpen(false);
      fetchUsers();
    } catch {
      setError("Failed to save user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      setIsSaving(true);
      await usersApi.delete(selectedUser.id);
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch {
      setError("Failed to delete user");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-800">Users</h1>
          <p className="text-stone-500 text-sm">Kelola akun pengguna</p>
        </div>
        <button 
          onClick={handleCreateUser} 
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-full hover:bg-emerald-700 transition-colors font-medium"
        >
          <Plus size={18} />
          Tambah User
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 rounded-2xl bg-rose-50 p-4 text-rose-600 border border-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Cari user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-white border border-stone-200 text-stone-600 text-sm rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
        >
          <option value="">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="kasir">Cashier</option>
          <option value="pembeli">Customer</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mb-4">
              <UsersIcon className="h-10 w-10 text-stone-300" />
            </div>
            <h3 className="text-lg font-serif font-bold text-stone-800">Belum ada user</h3>
            <p className="text-stone-500 mb-6">Mulai dengan menambahkan user pertama</p>
            <button 
              onClick={handleCreateUser} 
              className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-full hover:bg-emerald-700 transition-colors font-medium"
            >
              <Plus size={18} />
              Tambah User
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-stone-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-stone-400 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-stone-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
                          {(user.nama || user.full_name || user.email)[0].toUpperCase()}
                        </div>
                        <p className="font-semibold text-stone-800">{user.nama || user.full_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${roleColors[user.role] || "bg-stone-100 text-stone-600"}`}>
                        {roleIcons[user.role]}
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? "bg-emerald-50 text-emerald-600" 
                          : "bg-stone-100 text-stone-500"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-stone-400"}`}></span>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={selectedUser}
        onSave={handleSaveUser}
        isLoading={isSaving}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        userName={selectedUser?.nama || selectedUser?.email || ""}
        isLoading={isSaving}
      />
    </div>
  );
}
