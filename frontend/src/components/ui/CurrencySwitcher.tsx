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
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-green-600 transition-colors"
          aria-label="Select currency"
        >
          <span>{displayCurrency.code}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute right-0 bottom-full mb-2 z-50 w-36 rounded-lg bg-white shadow-lg ring-1 ring-black/5 py-1">
              {availableCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleSelect(currency)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                    currency.code === displayCurrency.code ? "text-green-600 font-medium" : "text-gray-700"
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
          </>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div ref={dropdownRef} className={`relative ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="Select currency"
        >
          <span className="text-sm font-bold text-gray-700">{displayCurrency.symbol}</span>
          <span className="text-xs text-gray-600 font-medium">{displayCurrency.code}</span>
          <ChevronDown className={`h-3 w-3 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
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
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-sm"
        aria-label="Select currency"
      >
        <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
        <span className="font-medium text-gray-900">{displayCurrency.symbol}</span>
        <span className="text-xs sm:text-sm text-gray-500 hidden xs:inline">{displayCurrency.code}</span>
        <ChevronDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 z-40 sm:hidden" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-40 sm:w-48 rounded-xl sm:rounded-2xl bg-white shadow-xl ring-1 ring-black/5 py-1.5 sm:py-2 overflow-hidden">
            <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 border-b border-gray-100">
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Pilih Mata Uang</p>
            </div>
            <div className="max-h-48 sm:max-h-64 overflow-y-auto">
              {availableCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleSelect(currency)}
                  className={`w-full px-2.5 sm:px-3 py-2 sm:py-2.5 text-left hover:bg-gray-50 flex items-center justify-between transition-colors ${
                    currency.code === displayCurrency.code ? "bg-green-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-100 text-xs sm:text-sm font-semibold">
                      {currency.symbol}
                    </span>
                    <div>
                      <p className={`text-sm font-medium ${currency.code === displayCurrency.code ? "text-green-600" : "text-gray-900"}`}>
                        {currency.code}
                      </p>
                    </div>
                  </div>
                  {currency.code === displayCurrency.code && (
                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CurrencySwitcher;
