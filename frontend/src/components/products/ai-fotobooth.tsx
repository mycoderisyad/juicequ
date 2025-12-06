"use client";

import { Camera, Sparkles, Clock, Share2, ImageIcon } from "lucide-react";

interface AIFotoboothProps {
  productId: string;
  productName: string;
}

/**
 * AI Fotobooth Component - Generate AI photos with juice products
 * Currently in "Coming Soon" state - Preview only
 * 
 * Fitur ini untuk user membuat review kekinian setelah membeli produk
 */
export function AIFotobooth({ productName }: AIFotoboothProps) {
  return (
    <div className="bg-gradient-to-br from-emerald-50 to-sky-50 rounded-2xl p-6 border border-emerald-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            AI Fotobooth
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </h3>
          <p className="text-sm text-gray-600">Share your moment with {productName}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700 mb-4">
        Upload selfie Anda dan biarkan AI kami membuat foto profesional dengan produk {productName}! 
        Perfect untuk review dan social media.
      </p>

      {/* Preview Features */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <span className="text-xs text-gray-600">AI-generated backgrounds</span>
        </div>
        <div className="flex items-start gap-2">
          <Camera className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <span className="text-xs text-gray-600">Professional lighting</span>
        </div>
        <div className="flex items-start gap-2">
          <ImageIcon className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <span className="text-xs text-gray-600">Multiple styles</span>
        </div>
        <div className="flex items-start gap-2">
          <Share2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <span className="text-xs text-gray-600">Easy sharing</span>
        </div>
      </div>

      {/* Coming Soon Badge */}
      <div className="bg-white rounded-xl p-4 border-2 border-dashed border-emerald-300">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-emerald-700" />
          <span className="font-semibold text-emerald-800">Coming Soon!</span>
        </div>
        <p className="text-xs text-center text-gray-600">
          Fitur ini sedang dalam pengembangan. <br />
          Segera hadir untuk pengalaman review yang lebih menarik!
        </p>
      </div>

      {/* Info note */}
      <div className="text-xs text-gray-600 mt-3 text-center space-y-1">
        <p>Fitur ini akan tersedia setelah Anda melakukan pembelian.</p>
        <p>Rating dan ulasan dari halaman Riwayat Pesanan akan ditampilkan di sini.</p>
      </div>
    </div>
  );
}
