"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { getImageUrl } from "@/lib/image-utils";

interface CartItemCardProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  color?: string;
  volume?: number;
  volumeUnit?: string;
  formatCurrency: (value: number) => string;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

function getItemImage(item: { image?: string; color?: string }) {
  if (item.image) return getImageUrl(item.image);
  if (item.color && (item.color.startsWith("http") || item.color.startsWith("/"))) {
    return getImageUrl(item.color);
  }
  return null;
}

export function CartItemCard({
  id,
  name,
  price,
  quantity,
  image,
  color,
  volume,
  volumeUnit,
  formatCurrency,
  onUpdateQuantity,
  onRemove,
}: CartItemCardProps) {
  const imageUrl = getItemImage({ image, color });

  return (
    <div className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="h-24 w-24 shrink-0 rounded-2xl object-cover"
        />
      ) : (
        <div
          className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl ${color || "bg-gray-100"}`}
        >
          <div className="h-16 w-16 rounded-full bg-white/30 shadow-inner" />
        </div>
      )}

      <div className="flex flex-1 flex-col justify-between sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{name}</h3>
          <div className="flex items-center gap-2">
            <p className="text-green-600 font-medium">{formatCurrency(price)}</p>
            {volume && volumeUnit && (
              <span className="text-sm text-gray-500">
                ({volume} {volumeUnit})
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-6 sm:mt-0">
          <div className="flex items-center rounded-full border border-gray-200 bg-gray-50">
            <button
              onClick={() => onUpdateQuantity(id, quantity - 1)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm font-medium text-gray-900">
              {quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(id, quantity + 1)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => onRemove(id)}
            className="rounded-full p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
