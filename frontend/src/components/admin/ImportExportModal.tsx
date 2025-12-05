"use client";

import { useState, useRef } from "react";
import { X, Upload, Download, FileSpreadsheet, FileText, Loader2, CheckCircle2, AlertCircle, FileDown } from "lucide-react";
import { adminProductsApi } from "@/lib/api/admin";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

type TabType = "export" | "import";

interface ImportResult {
  success: boolean;
  total_rows: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export function ImportExportModal({ isOpen, onClose, onImportSuccess }: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("export");
  const [isLoading, setIsLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleExportCsv = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const blob = await adminProductsApi.exportCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError("Gagal mengekspor data ke CSV");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const blob = await adminProductsApi.exportExcel();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError("Gagal mengekspor data ke Excel");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const blob = await adminProductsApi.downloadTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "products_template.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError("Gagal mengunduh template");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportResult(null);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      setIsLoading(true);
      setError(null);
      setImportResult(null);

      let result: ImportResult;
      if (selectedFile.name.endsWith(".csv")) {
        result = await adminProductsApi.importCsv(selectedFile);
      } else if (selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls")) {
        result = await adminProductsApi.importExcel(selectedFile);
      } else {
        setError("Format file tidak didukung. Gunakan CSV atau Excel (.xlsx)");
        return;
      }

      setImportResult(result);
      if (result.success && (result.imported > 0 || result.updated > 0)) {
        onImportSuccess();
      }
    } catch {
      setError("Gagal mengimpor data. Pastikan format file sesuai.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setImportResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-stone-100">
          <h2 className="text-xl font-serif font-bold text-stone-800">Import / Export Produk</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-100">
          <button
            onClick={() => { setActiveTab("export"); resetImport(); }}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
              activeTab === "export"
                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <Download size={16} className="inline-block mr-2" />
            Export
          </button>
          <button
            onClick={() => setActiveTab("import")}
            className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
              activeTab === "import"
                ? "text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <Upload size={16} className="inline-block mr-2" />
            Import
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-4 rounded-2xl bg-rose-50 text-rose-600 flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {activeTab === "export" ? (
            <div className="space-y-4">
              <p className="text-stone-500 text-sm mb-6">
                Ekspor semua data produk ke format CSV atau Excel untuk backup atau edit massal.
              </p>
              
              <button
                onClick={handleExportCsv}
                disabled={isLoading}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                  <FileText size={24} className="text-emerald-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-stone-800">Export ke CSV</p>
                  <p className="text-sm text-stone-500">Format universal, bisa dibuka di Excel</p>
                </div>
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin text-stone-400" />
                ) : (
                  <Download size={20} className="text-stone-400 group-hover:text-emerald-600" />
                )}
              </button>

              <button
                onClick={handleExportExcel}
                disabled={isLoading}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <FileSpreadsheet size={24} className="text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-stone-800">Export ke Excel</p>
                  <p className="text-sm text-stone-500">Format XLSX dengan styling</p>
                </div>
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin text-stone-400" />
                ) : (
                  <Download size={20} className="text-stone-400 group-hover:text-emerald-600" />
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {!importResult ? (
                <>
                  <p className="text-stone-500 text-sm mb-4">
                    Impor produk dari file CSV atau Excel. Produk dengan nama yang sama akan diperbarui.
                  </p>

                  {/* Download Template */}
                  <button
                    onClick={handleDownloadTemplate}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-stone-100 hover:bg-stone-200 transition-colors text-sm"
                  >
                    <FileDown size={18} className="text-stone-600" />
                    <span className="text-stone-700 font-medium">Download Template CSV</span>
                  </button>

                  {/* File Upload Area */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`mt-4 p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                      selectedFile
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-stone-300 hover:border-stone-400 hover:bg-stone-50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {selectedFile ? (
                      <div className="space-y-2">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                          {selectedFile.name.endsWith(".csv") ? (
                            <FileText size={28} className="text-emerald-600" />
                          ) : (
                            <FileSpreadsheet size={28} className="text-emerald-600" />
                          )}
                        </div>
                        <p className="font-semibold text-stone-800">{selectedFile.name}</p>
                        <p className="text-sm text-stone-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resetImport();
                          }}
                          className="text-sm text-rose-600 hover:underline"
                        >
                          Hapus file
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto">
                          <Upload size={28} className="text-stone-400" />
                        </div>
                        <p className="font-semibold text-stone-700">Pilih file untuk diimpor</p>
                        <p className="text-sm text-stone-500">CSV atau Excel (.xlsx, .xls)</p>
                      </div>
                    )}
                  </div>

                  {selectedFile && (
                    <button
                      onClick={handleImport}
                      disabled={isLoading}
                      className="w-full py-3 px-6 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Mengimpor...
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          Import Produk
                        </>
                      )}
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  {/* Success Summary */}
                  <div className={`p-6 rounded-2xl ${
                    importResult.success
                      ? "bg-emerald-50 border border-emerald-200"
                      : "bg-amber-50 border border-amber-200"
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      {importResult.success ? (
                        <CheckCircle2 size={24} className="text-emerald-600" />
                      ) : (
                        <AlertCircle size={24} className="text-amber-600" />
                      )}
                      <h3 className={`font-semibold ${importResult.success ? "text-emerald-800" : "text-amber-800"}`}>
                        {importResult.success ? "Import Selesai" : "Import Selesai dengan Peringatan"}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 rounded-xl bg-white">
                        <p className="text-stone-500">Total Baris</p>
                        <p className="text-xl font-bold text-stone-800">{importResult.total_rows}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white">
                        <p className="text-stone-500">Berhasil Ditambah</p>
                        <p className="text-xl font-bold text-emerald-600">{importResult.imported}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white">
                        <p className="text-stone-500">Diperbarui</p>
                        <p className="text-xl font-bold text-blue-600">{importResult.updated}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white">
                        <p className="text-stone-500">Dilewati</p>
                        <p className="text-xl font-bold text-amber-600">{importResult.skipped}</p>
                      </div>
                    </div>
                  </div>

                  {/* Errors */}
                  {importResult.errors.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                      <p className="font-semibold text-amber-800 mb-2">Peringatan:</p>
                      <ul className="text-sm text-amber-700 space-y-1 max-h-32 overflow-y-auto">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-500">•</span>
                            {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={resetImport}
                    className="w-full py-3 px-6 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors"
                  >
                    Import Lagi
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
