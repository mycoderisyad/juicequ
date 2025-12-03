/**
 * Store Status Indicator Component.
 * Shows whether the store is currently open or closed.
 * Can be used in header, footer, or anywhere.
 */
"use client";

import { Clock } from "lucide-react";

interface StoreStatusIndicatorProps {
  isOpen: boolean;
  openingTime?: string;
  closingTime?: string;
  showHours?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StoreStatusIndicator({
  isOpen,
  openingTime,
  closingTime,
  showHours = false,
  size = "md",
  className = "",
}: StoreStatusIndicatorProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hour, minute] = time.split(":");
    const h = parseInt(hour);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minute} ${ampm}`;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${
          isOpen
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            isOpen ? "bg-green-500 animate-pulse" : "bg-red-500"
          }`}
        />
        {isOpen ? "Buka" : "Tutup"}
      </span>
      
      {showHours && openingTime && closingTime && (
        <span className="flex items-center gap-1 text-gray-500 text-sm">
          <Clock className="h-3.5 w-3.5" />
          {formatTime(openingTime)} - {formatTime(closingTime)}
        </span>
      )}
    </div>
  );
}

export default StoreStatusIndicator;
