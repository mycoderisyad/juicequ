"use client";

import { getImageUrl } from "@/lib/image-utils";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  color?: string;
}

interface OrderItemsSummaryProps {
  items: OrderItem[];
  formatCurrency: (value: number) => string;
}

function getItemImage(item: { image?: string; color?: string }) {
  if (item.image) return getImageUrl(item.image);
  if (
    item.color &&
    (item.color.startsWith("http") || item.color.startsWith("/"))
  ) {
    return getImageUrl(item.color);
  }
  return null;
}

function getValidPrice(price: number | string | undefined): number {
  if (typeof price === "number" && !isNaN(price)) return price;
  if (typeof price === "string") {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function OrderItemsSummary({
  items,
  formatCurrency,
}: OrderItemsSummaryProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        Order Items ({items.length})
      </h2>
      <div className="space-y-4">
        {items.map((item) => {
          const imageUrl = getItemImage(item);
          const itemPrice = getValidPrice(item.price);

          return (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.name}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <div
                    className={`h-12 w-12 rounded-xl ${item.color || "bg-gray-100"}`}
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
              </div>
              <p className="font-semibold text-gray-900">
                {formatCurrency(itemPrice * item.quantity)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

