"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Tags,
  AlertCircle,
  X,
  Check,
  Loader2,
  Upload,
  Image as ImageIcon,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoriesApi, uploadApi } from "@/lib/api/admin";
import { getImageUrl } from "@/lib/image-utils";

interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  product_count?: number;
}

// Extended emoji options organized by category
const EMOJI_ICONS = {
  fruits: ["🍎", "🍊", "🍋", "🍇", "🍓", "🫐", "🍑", "🍒", "🍍", "🥭", "🍌", "🥝", "🍈", "🍐", "🍉", "🥥"],
  vegetables: ["🥕", "🥬", "🥒", "🥦", "🥑", "🍅", "🌽", "🥗", "🥜", "🫛", "🧄", "🧅", "🌶️", "🫑"],
  drinks: ["🍹", "🥤", "🧃", "🍵", "☕", "🥛", "🧋", "🍺", "🍷", "🥂", "🍾", "🫖", "🧉"],
  food: ["🥣", "🍲", "🥗", "🍜", "🍝", "🍱", "🍛", "🥡", "🍚", "🥧", "🍰", "🧁", "🍩", "🍪"],
  health: ["💉", "💊", "🩺", "❤️", "💪", "🏃", "🧘", "⚡", "✨", "🌟", "💫", "🔥", "💧", "🌿"],
  nature: ["🌱", "🌿", "🍃", "🌾", "🌻", "🌺", "🌸", "🌼", "🪴", "🌵", "🎋", "🍀", "☘️"],
  other: ["⭐", "🎯", "🏆", "👑", "💎", "🎁", "🛒", "📦", "🏷️", "💰", "🔖", "📌", "🎨", "🌈"]
};

// Flatten all emojis for quick access
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ALL_EMOJIS = Object.values(EMOJI_ICONS).flat();

// Icon Picker Component
function IconPicker({
  selectedIcon,
  onSelectIcon,
  onUploadIcon,
  isUploading,
}: {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  onUploadIcon: (file: File) => Promise<void>;
  isUploading: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"emoji" | "upload">("emoji");
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_ICONS>("fruits");
  const [customIconPreview, setCustomIconPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if selected icon is a URL (custom uploaded icon)
  const isCustomIcon = selectedIcon?.startsWith("http") || selectedIcon?.startsWith("/");

  useEffect(() => {
    if (isCustomIcon) {
      setCustomIconPreview(selectedIcon);
      setActiveTab("upload");
    }
  }, [selectedIcon, isCustomIcon]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      alert("Invalid file type. Please use PNG, JPG, GIF, WebP, or SVG.");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("File too large. Maximum 2MB.");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomIconPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    await onUploadIcon(file);
  };

  const categoryLabels: Record<keyof typeof EMOJI_ICONS, string> = {
    fruits: "🍎 Fruits",
    vegetables: "🥕 Vegetables",
    drinks: "🍹 Drinks",
    food: "🍲 Food",
    health: "💪 Health",
    nature: "🌿 Nature",
    other: "⭐ Other"
  };

  return (
    <div className="space-y-3">
      {/* Tab Selector */}
      <div className="flex rounded-full bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("emoji")}
          className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
            activeTab === "emoji"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          😀 Emoji Icons
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${
            activeTab === "upload"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-600 hover:text-stone-900"
          }`}
        >
          <Upload className="inline h-4 w-4 mr-1" />
          Custom Icon
        </button>
      </div>

      {activeTab === "emoji" ? (
        <div className="space-y-3">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-1">
            {(Object.keys(EMOJI_ICONS) as Array<keyof typeof EMOJI_ICONS>).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>

          {/* Emoji Grid */}
          <div className="max-h-40 overflow-y-auto rounded-2xl border border-stone-200 p-3">
            <div className="grid grid-cols-8 gap-1">
              {EMOJI_ICONS[activeCategory].map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => onSelectIcon(icon)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-xl transition-all hover:scale-110 ${
                    selectedIcon === icon && !isCustomIcon
                      ? "bg-emerald-100 ring-2 ring-emerald-500"
                      : "hover:bg-stone-100"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Preview */}
          {selectedIcon && !isCustomIcon && (
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <span>Selected:</span>
              <span className="text-2xl">{selectedIcon}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Upload Area */}
          <div
            className={`relative rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
              customIconPreview ? "border-emerald-300 bg-emerald-50/50" : "border-stone-300 hover:border-stone-400"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="mt-2 text-sm text-emerald-600">Uploading...</p>
              </div>
            ) : customIconPreview ? (
              <div className="flex flex-col items-center">
                <img
                  src={customIconPreview}
                  alt="Custom icon"
                  className="h-16 w-16 object-contain rounded-xl"
                />
                <p className="mt-2 text-sm text-stone-600">Click to change</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-stone-100 p-3">
                  <ImageIcon className="h-6 w-6 text-stone-400" />
                </div>
                <p className="mt-2 text-sm text-stone-600">
                  <span className="font-medium text-emerald-600">Click to upload</span> or drag and drop
                </p>
                <p className="mt-1 text-xs text-stone-500">PNG, JPG, GIF, WebP, SVG (max 2MB)</p>
                <p className="mt-1 text-xs text-stone-400">Recommended: 64x64 or 128x128 pixels</p>
              </div>
            )}
          </div>

          {/* Clear Custom Icon */}
          {customIconPreview && (
            <button
              type="button"
              onClick={() => {
                setCustomIconPreview(null);
                onSelectIcon("🍹");
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove custom icon & use emoji instead
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Category Form Modal
function CategoryModal({
  isOpen,
  onClose,
  category,
  onSave,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSave: (data: Partial<Category>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    icon: "🍹",
    description: "",
  });
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        id: category.id,
        name: category.name,
        icon: category.icon || "🍹",
        description: category.description || "",
      });
    } else {
      setFormData({
        id: "",
        name: "",
        icon: "🍹",
        description: "",
      });
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleIconUpload = async (file: File) => {
    try {
      setIsUploadingIcon(true);
      const result = await uploadApi.uploadImage(file, "catalog");
      setFormData({ ...formData, icon: result.url });
    } catch (error) {
      console.error("Failed to upload icon:", error);
      alert("Failed to upload icon. Please try again.");
    } finally {
      setIsUploadingIcon(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-4xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-stone-900">
            {category ? "Edit Category" : "Add New Category"}
          </h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-stone-100 text-stone-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!category && (
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700">
                Category ID *
              </label>
              <Input
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                placeholder="e.g., smoothies"
                className="rounded-xl border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                required
              />
              <p className="mt-1.5 text-xs text-stone-500">Lowercase, no spaces (use dashes)</p>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Category Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Smoothies"
              className="rounded-xl border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Icon
            </label>
            <IconPicker
              selectedIcon={formData.icon}
              onSelectIcon={(icon) => setFormData({ ...formData, icon })}
              onUploadIcon={handleIconUpload}
              isUploading={isUploadingIcon}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the category..."
              className="w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-full px-5">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isUploadingIcon} className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-5">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {category ? "Update Category" : "Create Category"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal
function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
  productCount,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoryName: string;
  productCount: number;
  isLoading: boolean;
}) {
  if (!isOpen) return null;

  const hasProducts = productCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-4xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3 text-red-600">
          <div className="rounded-full bg-red-100 p-2">
            <AlertCircle className="h-5 w-5" />
          </div>
          <h2 className="font-serif text-xl font-bold">Delete Category</h2>
        </div>
        {hasProducts ? (
          <div className="mb-6">
            <p className="mb-3 text-stone-600">
              Cannot delete <strong>{categoryName}</strong> because it contains{" "}
              <strong>{productCount} product{productCount > 1 ? "s" : ""}</strong>.
            </p>
            <p className="text-sm text-amber-700 bg-amber-50 p-4 rounded-xl">
              ⚠️ Please move or delete all products in this category first before deleting it.
            </p>
          </div>
        ) : (
          <p className="mb-6 text-stone-600">
            Are you sure you want to delete <strong>{categoryName}</strong>? This action cannot be undone.
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-full px-5">
            {hasProducts ? "Close" : "Cancel"}
          </Button>
          {!hasProducts && (
            <Button variant="destructive" onClick={onConfirm} disabled={isLoading} className="rounded-full px-5">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await categoriesApi.getAll();
      setCategories(response.categories || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError("Failed to load categories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleSaveCategory = async (data: Partial<Category>) => {
    try {
      setIsSaving(true);
      if (selectedCategory) {
        await categoriesApi.update(selectedCategory.id, data);
      } else {
        await categoriesApi.create(data as {
          id: string;
          name: string;
          icon?: string;
          description?: string;
        });
      }
      setIsCategoryModalOpen(false);
      fetchCategories();
    } catch (err) {
      console.error("Failed to save category:", err);
      setError("Failed to save category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    try {
      setIsSaving(true);
      setError(null);
      await categoriesApi.delete(selectedCategory.id);
      setIsDeleteModalOpen(false);
      fetchCategories();
    } catch (err: unknown) {
      console.error("Failed to delete category:", err);
      // Extract error message from API response
      const axiosError = err as { response?: { data?: { detail?: string } } };
      const errorMessage = axiosError.response?.data?.detail || "Failed to delete category";
      setError(errorMessage);
      setIsDeleteModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900">Categories</h1>
          <p className="text-stone-500">Manage product categories</p>
        </div>
        <Button onClick={handleCreateCategory} className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-5">
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 p-4 text-red-600">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="rounded-[2.5rem] bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="rounded-full bg-stone-100 p-4 mb-4">
              <Tags className="h-10 w-10 text-stone-400" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-stone-900">No categories found</h3>
            <p className="text-stone-500 mt-1">Get started by adding your first category</p>
            <Button onClick={handleCreateCategory} className="mt-6 rounded-full bg-emerald-600 hover:bg-emerald-700 px-6">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const isCustomIcon = category.icon?.startsWith("http") || category.icon?.startsWith("/");
              return (
                <div
                  key={category.id}
                  className="group flex items-center justify-between rounded-2xl border border-stone-200 p-4 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl overflow-hidden">
                      {isCustomIcon && category.icon ? (
                        <>
                          <img 
                            src={getImageUrl(category.icon)} 
                            alt={category.name} 
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const fallback = e.currentTarget.parentElement?.querySelector("[data-fallback]");
                              if (fallback instanceof HTMLElement) fallback.classList.remove("hidden");
                            }}
                          />
                          <span data-fallback className="hidden">
                            {category.icon || "🍹"}
                          </span>
                        </>
                      ) : (
                        <span>{category.icon || "🍹"}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">{category.name}</p>
                      <p className="text-sm text-stone-500 flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" />
                        {category.product_count || 0} products
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="rounded-full p-2.5 text-stone-500 hover:bg-white hover:text-stone-900 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(category)}
                      className="rounded-full p-2.5 text-stone-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        category={selectedCategory}
        onSave={handleSaveCategory}
        isLoading={isSaving}
      />

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCategory}
        categoryName={selectedCategory?.name || ""}
        productCount={selectedCategory?.product_count || 0}
        isLoading={isSaving}
      />
    </div>
  );
}
