"use client";

import { Minus, Plus } from "lucide-react";

interface QuantityControlProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  size?: "sm" | "md";
}

export function QuantityControl({
  quantity,
  onIncrease,
  onDecrease,
  size = "md",
}: QuantityControlProps) {
  const sizeClasses = {
    sm: "p-1.5",
    md: "p-2",
  };

  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className="flex items-center rounded-full border border-gray-200 bg-gray-50">
      <button
        onClick={onDecrease}
        className={`${sizeClasses[size]} text-gray-600 hover:text-gray-900`}
      >
        <Minus className={iconSize} />
      </button>
      <span className="w-8 text-center text-sm font-medium text-gray-900">
        {quantity}
      </span>
      <button
        onClick={onIncrease}
        className={`${sizeClasses[size]} text-gray-600 hover:text-gray-900`}
      >
        <Plus className={iconSize} />
      </button>
    </div>
  );
}

