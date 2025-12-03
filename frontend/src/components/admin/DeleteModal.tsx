"use client";

import { AlertCircle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
  isLoading: boolean;
}

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = "Product",
  isLoading,
}: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3 text-red-600">
          <AlertCircle className="h-6 w-6" />
          <h2 className="text-xl font-bold">Delete {itemType}</h2>
        </div>
        <p className="mb-6 text-gray-600">
          Are you sure you want to delete <strong>{itemName}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
