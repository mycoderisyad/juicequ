"use client";

import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BatchDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  selectedNames?: string[];
  isLoading: boolean;
}

export function BatchDeleteModal({ isOpen, onClose, onConfirm, selectedCount, selectedNames = [], isLoading }: BatchDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3 text-red-600">
          <Trash2 className="h-6 w-6" />
          <h2 className="text-xl font-bold">Hapus {selectedCount} produk</h2>
        </div>
        <p className="mb-4 text-gray-600">
          Anda akan menghapus <strong>{selectedCount}</strong> produk. Produk akan dihapus dengan metode &quot;soft delete&quot; (tidak dihapus permanen).
        </p>
        {selectedNames.length > 0 && (
          <div className="mb-4 max-h-36 overflow-y-auto rounded-md border border-stone-100 p-3 bg-stone-50 text-sm">
            <ul className="list-disc list-inside space-y-1">
              {selectedNames.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Produk
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
