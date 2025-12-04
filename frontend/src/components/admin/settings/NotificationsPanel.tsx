"use client";

import { Bell } from "lucide-react";

export function NotificationsPanel() {
  return (
    <div className="rounded-[2.5rem] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-orange-100 p-2">
          <Bell className="h-5 w-5 text-orange-600" />
        </div>
        <h2 className="font-serif text-lg font-semibold text-stone-900">Notifikasi</h2>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-stone-50 rounded-2xl">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-medium text-stone-900">Order Baru</span>
              <p className="text-sm text-stone-500">Notifikasi saat ada order masuk</p>
            </div>
            <input type="checkbox" defaultChecked className="h-5 w-5 rounded-lg text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
          </label>
        </div>
        <div className="p-4 bg-stone-50 rounded-2xl">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-medium text-stone-900">Stok Menipis</span>
              <p className="text-sm text-stone-500">Notifikasi saat stok produk rendah</p>
            </div>
            <input type="checkbox" defaultChecked className="h-5 w-5 rounded-lg text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
          </label>
        </div>
        <div className="p-4 bg-stone-50 rounded-2xl">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="font-medium text-stone-900">Review Baru</span>
              <p className="text-sm text-stone-500">Notifikasi saat ada review baru</p>
            </div>
            <input type="checkbox" className="h-5 w-5 rounded-lg text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
          </label>
        </div>
      </div>
    </div>
  );
}
