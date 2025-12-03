"use client";

import { Bell } from "lucide-react";

export function NotificationsPanel() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <Bell className="h-5 w-5 text-orange-600" />
        <h2 className="text-lg font-semibold text-gray-900">Notifikasi</h2>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-xl">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">Order Baru</span>
              <p className="text-sm text-gray-500">Notifikasi saat ada order masuk</p>
            </div>
            <input type="checkbox" defaultChecked className="h-5 w-5 rounded text-green-600 focus:ring-green-500" />
          </label>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">Stok Menipis</span>
              <p className="text-sm text-gray-500">Notifikasi saat stok produk rendah</p>
            </div>
            <input type="checkbox" defaultChecked className="h-5 w-5 rounded text-green-600 focus:ring-green-500" />
          </label>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">Review Baru</span>
              <p className="text-sm text-gray-500">Notifikasi saat ada review baru</p>
            </div>
            <input type="checkbox" className="h-5 w-5 rounded text-green-600 focus:ring-green-500" />
          </label>
        </div>
      </div>
    </div>
  );
}
