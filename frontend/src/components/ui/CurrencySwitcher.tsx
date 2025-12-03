"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Globe } from "lucide-react";
import { useCurrency } from "@/lib/hooks/use-store";

interface CurrencySwitcherProps {
  className?: string;
  variant?: "default" | "compact" | "minimal";
}

export function CurrencySwitcher({ className = "", variant = "default" }: CurrencySwitcherProps) {
  const { displayCurrency, availableCurrencies, setDisplayCurrency, isLoading } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (currency: typeof displayCurrency) => {
    setDisplayCurrency(currency);
    setIsOpen(false);
  };

  if (variant === "minimal") {
    return (
      <div ref={dropdownRef} className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Select currency"
        >
          <span className="font-medium">{displayCurrency.code}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 w-32 rounded-lg bg-white shadow-lg ring-1 ring-black/5 py-1">
            {availableCurrencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleSelect(currency)}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                  currency.code === displayCurrency.code ? "text-green-600 font-medium" : "text-gray-700"
                }`}
              >
                <span>{currency.code}</span>
                {currency.code === displayCurrency.code && <Check className="h-3 w-3" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div ref={dropdownRef} className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Select currency"
        >
          <span className="text-sm font-medium">{displayCurrency.symbol}</span>
          <span className="text-xs text-gray-500">{displayCurrency.code}</span>
          <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-xl bg-white shadow-lg ring-1 ring-black/5 py-1">
            {availableCurrencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleSelect(currency)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                  currency.code === displayCurrency.code ? "bg-green-50 text-green-600" : "text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{currency.symbol}</span>
                  <span>{currency.code}</span>
                </div>
                {currency.code === displayCurrency.code && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
        aria-label="Select currency"
      >
        <Globe className="h-4 w-4 text-gray-500" />
        <span className="font-medium text-gray-900">{displayCurrency.symbol}</span>
        <span className="text-sm text-gray-500">{displayCurrency.code}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 py-2 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pilih Mata Uang</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {availableCurrencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleSelect(currency)}
                className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 flex items-center justify-between transition-colors ${
                  currency.code === displayCurrency.code ? "bg-green-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-sm font-semibold">
                    {currency.symbol}
                  </span>
                  <div>
                    <p className={`font-medium ${currency.code === displayCurrency.code ? "text-green-600" : "text-gray-900"}`}>
                      {currency.code}
                    </p>
                  </div>
                </div>
                {currency.code === displayCurrency.code && (
                  <Check className="h-5 w-5 text-green-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CurrencySwitcher;
