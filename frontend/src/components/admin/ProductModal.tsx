"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { X, Check, Loader2, AlertCircle, ChevronDown, ChevronUp, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "./ImageUpload";

interface Product {
  id: number | string;
  name: string;
  description: string;
  price?: number;
  base_price?: number;
  category?: string;
  category_id?: string;
  image?: string;
  image_url?: string;
  image_color?: string;
  hero_image?: string;
  bottle_image?: string;
  thumbnail_image?: string;
  is_available: boolean;
  stock?: number;
  stock_quantity?: number;
  ingredients?: string[];
  // Size variants
  has_sizes?: boolean;
  size_prices?: { small?: number; medium?: number; large?: number };
  size_volumes?: { small?: number; medium?: number; large?: number };
  volume_unit?: string;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  categories: Category[];
  onSave: (data: Partial<Product>) => void;
  isLoading: boolean;
}

interface FormData {
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  stock: number;
  ingredients: string[];
  image: string;
  hero_image: string;
  bottle_image: string;
  thumbnail_image: string;
  // Size variants
  has_sizes: boolean;
  size_prices: { small: number; medium: number; large: number };
  size_volumes: { small: number; medium: number; large: number };
  volume_unit: string;
}

function getInitialFormData(product: Product | null, categories: Category[]): FormData {
  if (product) {
    const basePrice = product.price || product.base_price || 0;
    return {
      name: product.name,
      description: product.description,
      price: basePrice,
      category: product.category || product.category_id || "",
      is_available: product.is_available,
      stock: product.stock ?? 100,
      ingredients: product.ingredients || [],
      image: product.image || product.image_color || "",
      hero_image: product.hero_image || "",
      bottle_image: product.bottle_image || "",
      thumbnail_image: product.thumbnail_image || "",
      // Size variants
      has_sizes: product.has_sizes ?? true,
      size_prices: {
        small: product.size_prices?.small ?? Math.round(basePrice * 0.8),
        medium: product.size_prices?.medium ?? basePrice,
        large: product.size_prices?.large ?? Math.round(basePrice * 1.3),
      },
      size_volumes: {
        small: product.size_volumes?.small ?? 250,
        medium: product.size_volumes?.medium ?? 350,
        large: product.size_volumes?.large ?? 500,
      },
      volume_unit: product.volume_unit || "ml",
    };
  }
  return {
    name: "",
    description: "",
    price: 0,
    category: categories[0]?.id || "",
    is_available: true,
    stock: 100,
    ingredients: [],
    image: "",
    hero_image: "",
    bottle_image: "",
    thumbnail_image: "",
    // Size variants
    has_sizes: true,
    size_prices: { small: 0, medium: 0, large: 0 },
    size_volumes: { small: 250, medium: 350, large: 500 },
    volume_unit: "ml",
  };
}

function useProductForm(product: Product | null, categories: Category[]) {
  const initialData = useMemo(() => getInitialFormData(product, categories), [product, categories]);
  const [formData, setFormData] = useState<FormData>(initialData);
  const [ingredientInput, setIngredientInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData(getInitialFormData(product, categories));
    setIngredientInput("");
    setValidationError(null);
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        ingredients: [...prev.ingredients, ingredientInput.trim()],
      }));
      setIngredientInput("");
    }
  };

  const removeIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const validate = (): boolean => {
    setValidationError(null);
    if (formData.name.length < 2) {
      setValidationError("Product name must be at least 2 characters");
      return false;
    }
    if (formData.description.length < 10) {
      setValidationError("Description must be at least 10 characters");
      return false;
    }
    if (formData.price <= 0) {
      setValidationError("Price must be greater than 0");
      return false;
    }
    if (!formData.category) {
      setValidationError("Please select a category");
      return false;
    }
    return true;
  };

  return {
    formData,
    updateField,
    ingredientInput,
    setIngredientInput,
    addIngredient,
    removeIngredient,
    validationError,
    validate,
    resetForm,
  };
}

export function ProductModal({
  isOpen,
  onClose,
  product,
  categories,
  onSave,
  isLoading,
}: ProductModalProps) {
  const {
    formData,
    updateField,
    ingredientInput,
    setIngredientInput,
    addIngredient,
    removeIngredient,
    validationError,
    validate,
  } = useProductForm(product, categories);
  
  const [showImageSection, setShowImageSection] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <ModalHeader
          title={product ? "Edit Product" : "Add New Product"}
          onClose={onClose}
        />

        {validationError && <ValidationError message={validationError} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormFieldText
            label="Product Name"
            hint="min. 2 characters"
            value={formData.name}
            onChange={(v) => updateField("name", v)}
            placeholder="e.g., Berry Blast Smoothie"
            minLength={2}
            maxLength={100}
            required
          />

          <FormFieldTextarea
            label="Description"
            hint="min. 10 characters"
            value={formData.description}
            onChange={(v) => updateField("description", v)}
            placeholder="Describe the product in detail..."
            minLength={10}
            maxLength={500}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <FormFieldPrice
              label="Price (Rp)"
              value={formData.price}
              onChange={(v) => updateField("price", v)}
              required
            />
            <FormFieldSelect
              label="Category"
              value={formData.category}
              onChange={(v) => updateField("category", v)}
              options={categories.map((c) => ({ value: c.id, label: `${c.icon || ""} ${c.name}` }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormFieldNumber
              label="Stock"
              value={formData.stock}
              onChange={(v) => updateField("stock", v)}
              min={0}
            />
            <FormFieldColorPicker
              label="Image Color Class"
              value={formData.image}
              onChange={(v) => updateField("image", v)}
            />
          </div>

          {/* Size Pricing Section */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-gray-900">Size Variants</span>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.has_sizes}
                  onChange={(e) => updateField("has_sizes", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-gray-700">Enable multiple sizes</span>
              </label>
            </div>
            
            {formData.has_sizes && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-gray-700">Volume Unit:</label>
                  <select
                    value={formData.volume_unit}
                    onChange={(e) => updateField("volume_unit", e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-1 text-sm"
                  >
                    <option value="ml">ml (milliliter)</option>
                    <option value="oz">oz (ounce)</option>
                    <option value="L">L (liter)</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {/* Small Size */}
                  <div className="rounded-lg border border-gray-200 p-3">
                    <h4 className="font-medium text-gray-800 mb-2 text-center">Small (S)</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500">Price (Rp)</label>
                        <Input
                          type="number"
                          value={formData.size_prices.small || ""}
                          onChange={(e) => updateField("size_prices", {
                            ...formData.size_prices,
                            small: Number(e.target.value) || 0
                          })}
                          placeholder="10000"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Volume ({formData.volume_unit})</label>
                        <Input
                          type="number"
                          value={formData.size_volumes.small || ""}
                          onChange={(e) => updateField("size_volumes", {
                            ...formData.size_volumes,
                            small: Number(e.target.value) || 0
                          })}
                          placeholder="250"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Medium Size */}
                  <div className="rounded-lg border-2 border-green-200 bg-green-50/50 p-3">
                    <h4 className="font-medium text-gray-800 mb-2 text-center">Medium (M)</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500">Price (Rp)</label>
                        <Input
                          type="number"
                          value={formData.size_prices.medium || ""}
                          onChange={(e) => updateField("size_prices", {
                            ...formData.size_prices,
                            medium: Number(e.target.value) || 0
                          })}
                          placeholder="15000"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Volume ({formData.volume_unit})</label>
                        <Input
                          type="number"
                          value={formData.size_volumes.medium || ""}
                          onChange={(e) => updateField("size_volumes", {
                            ...formData.size_volumes,
                            medium: Number(e.target.value) || 0
                          })}
                          placeholder="350"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Large Size */}
                  <div className="rounded-lg border border-gray-200 p-3">
                    <h4 className="font-medium text-gray-800 mb-2 text-center">Large (L)</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500">Price (Rp)</label>
                        <Input
                          type="number"
                          value={formData.size_prices.large || ""}
                          onChange={(e) => updateField("size_prices", {
                            ...formData.size_prices,
                            large: Number(e.target.value) || 0
                          })}
                          placeholder="20000"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Volume ({formData.volume_unit})</label>
                        <Input
                          type="number"
                          value={formData.size_volumes.large || ""}
                          onChange={(e) => updateField("size_volumes", {
                            ...formData.size_volumes,
                            large: Number(e.target.value) || 0
                          })}
                          placeholder="500"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-400 text-center">
                  Tip: Base price above is used as fallback when size prices are not set
                </p>
              </div>
            )}
          </div>

          {/* Image Upload Section */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowImageSection(!showImageSection)}
              className="flex w-full items-center justify-between text-left"
            >
              <span className="font-medium text-gray-900">
                Product Images {!product && <span className="text-xs text-gray-400 ml-2">(optional)</span>}
              </span>
              {showImageSection ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            {showImageSection && (
              <div className="mt-4 space-y-4">
                <p className="text-sm text-gray-500">
                  Upload images for the product. All images are auto-converted to WebP for optimal performance.
                  {!product && " You can also upload images after creating the product."}
                </p>
                <div className="grid gap-4 md:grid-cols-3">
                  <ImageUpload
                    label="Thumbnail"
                    imageType="thumbnail"
                    productId={product ? String(product.id) : undefined}
                    currentImage={formData.thumbnail_image}
                    onUploadComplete={(url) => updateField("thumbnail_image", url)}
                    helpText="400x400 for product cards"
                  />
                  <ImageUpload
                    label="Hero Background"
                    imageType="hero"
                    productId={product ? String(product.id) : undefined}
                    currentImage={formData.hero_image}
                    onUploadComplete={(url) => updateField("hero_image", url)}
                    helpText="1920x1080 recommended"
                  />
                  <ImageUpload
                    label="Bottle Image"
                    imageType="bottle"
                    productId={product ? String(product.id) : undefined}
                    currentImage={formData.bottle_image}
                    onUploadComplete={(url) => updateField("bottle_image", url)}
                    helpText="500x800, transparent PNG"
                  />
                </div>
              </div>
            )}
          </div>

          <IngredientsField
            ingredients={formData.ingredients}
            inputValue={ingredientInput}
            onInputChange={setIngredientInput}
            onAdd={addIngredient}
            onRemove={removeIngredient}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_available"
              checked={formData.is_available}
              onChange={(e) => updateField("is_available", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="is_available" className="text-sm text-gray-700">
              Available for sale
            </label>
          </div>

          <FormActions
            onCancel={onClose}
            isLoading={isLoading}
            submitLabel={product ? "Update Product" : "Create Product"}
          />
        </form>
      </div>
    </div>
  );
}

function ModalHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}

function ValidationError({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 flex items-center gap-2">
      <AlertCircle className="h-4 w-4" />
      {message}
    </div>
  );
}

function FormFieldText({
  label,
  hint,
  value,
  onChange,
  placeholder,
  minLength,
  maxLength,
  required,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && "*"} {hint && <span className="text-xs text-gray-400">({hint})</span>}
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
        required={required}
      />
    </div>
  );
}

function FormFieldTextarea({
  label,
  hint,
  value,
  onChange,
  placeholder,
  minLength,
  maxLength,
  required,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && "*"} {hint && <span className="text-xs text-gray-400">({hint})</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        rows={3}
        minLength={minLength}
        maxLength={maxLength}
        required={required}
      />
      {maxLength && (
        <p className="mt-1 text-xs text-gray-400">{value.length}/{maxLength} characters</p>
      )}
    </div>
  );
}

function FormFieldNumber({
  label,
  value,
  onChange,
  step,
  min,
  required,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && "*"}
      </label>
      <Input
        type="number"
        step={step}
        min={min}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        required={required}
      />
    </div>
  );
}

function FormFieldPrice({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  required?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(value > 0 ? value.toString() : "");

  // Sync display value when external value changes
  useEffect(() => {
    setDisplayValue(value > 0 ? value.toString() : "");
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty input
    if (inputValue === "") {
      setDisplayValue("");
      onChange(0);
      return;
    }
    
    // Remove leading zeros and non-numeric characters
    const cleanedValue = inputValue.replace(/^0+(?=\d)/, "").replace(/[^\d]/g, "");
    
    setDisplayValue(cleanedValue);
    const numValue = parseInt(cleanedValue, 10);
    onChange(isNaN(numValue) ? 0 : numValue);
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && "*"}
      </label>
      <Input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder="0"
        required={required}
      />
    </div>
  );
}

// Predefined Tailwind color palette for quick selection
const colorPalette = [
  { name: "Red", class: "bg-red-500", color: "#ef4444" },
  { name: "Orange", class: "bg-orange-500", color: "#f97316" },
  { name: "Amber", class: "bg-amber-500", color: "#f59e0b" },
  { name: "Yellow", class: "bg-yellow-500", color: "#eab308" },
  { name: "Lime", class: "bg-lime-500", color: "#84cc16" },
  { name: "Green", class: "bg-green-500", color: "#22c55e" },
  { name: "Emerald", class: "bg-emerald-500", color: "#10b981" },
  { name: "Teal", class: "bg-teal-500", color: "#14b8a6" },
  { name: "Cyan", class: "bg-cyan-500", color: "#06b6d4" },
  { name: "Sky", class: "bg-sky-500", color: "#0ea5e9" },
  { name: "Blue", class: "bg-blue-500", color: "#3b82f6" },
  { name: "Indigo", class: "bg-indigo-500", color: "#6366f1" },
  { name: "Violet", class: "bg-violet-500", color: "#8b5cf6" },
  { name: "Purple", class: "bg-purple-500", color: "#a855f7" },
  { name: "Fuchsia", class: "bg-fuchsia-500", color: "#d946ef" },
  { name: "Pink", class: "bg-pink-500", color: "#ec4899" },
  { name: "Rose", class: "bg-rose-500", color: "#f43f5e" },
];

function FormFieldColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customColor, setCustomColor] = useState("#10b981");
  const pickerRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
        setShowCustomInput(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedColor = colorPalette.find(c => c.class === value);
  
  // Check if value is a custom color (starts with # or rgb)
  const isCustomColor = value && !selectedColor && (value.startsWith("#") || value.startsWith("rgb") || value.startsWith("bg-["));

  // Extract display color for preview
  const getDisplayStyle = () => {
    if (!value) return {};
    if (value.startsWith("#") || value.startsWith("rgb")) {
      return { backgroundColor: value };
    }
    if (value.startsWith("bg-[#")) {
      // Extract hex from bg-[#xxxxxx]
      const match = value.match(/bg-\[(#[a-fA-F0-9]+)\]/);
      if (match) return { backgroundColor: match[1] };
    }
    return {};
  };

  const handleCustomColorApply = () => {
    // Save as Tailwind arbitrary value format
    onChange(`bg-[${customColor}]`);
    setShowPicker(false);
    setShowCustomInput(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="w-full flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 hover:border-green-500 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      >
        {value ? (
          <>
            {selectedColor ? (
              <div className={`w-6 h-6 rounded-md ${value}`} />
            ) : (
              <div className="w-6 h-6 rounded-md" style={getDisplayStyle()} />
            )}
            <span className="flex-1 text-left">
              {selectedColor?.name || (isCustomColor ? "Custom Color" : value)}
            </span>
          </>
        ) : (
          <>
            <Palette className="w-5 h-5 text-gray-400" />
            <span className="flex-1 text-left text-gray-400">Select a color</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showPicker ? "rotate-180" : ""}`} />
      </button>

      {showPicker && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
          {/* Default Colors Section */}
          <p className="text-xs font-medium text-gray-500 mb-2">Default Colors</p>
          <div className="grid grid-cols-6 gap-2">
            {colorPalette.map((color) => (
              <button
                key={color.class}
                type="button"
                onClick={() => {
                  onChange(color.class);
                  setShowPicker(false);
                  setShowCustomInput(false);
                }}
                className={`w-8 h-8 rounded-lg ${color.class} hover:scale-110 transition-transform ${
                  value === color.class ? "ring-2 ring-offset-2 ring-green-500" : ""
                }`}
                title={color.name}
              />
            ))}
          </div>
          
          {/* Add Custom Color Section */}
          <div className="mt-3 pt-3 border-t">
            {!showCustomInput ? (
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(true);
                  // Open native color picker after a short delay
                  setTimeout(() => colorInputRef.current?.click(), 100);
                }}
                className="w-full flex items-center justify-center gap-2 text-sm text-green-600 hover:text-green-700 py-2 rounded-lg hover:bg-green-50 transition-colors"
              >
                <span className="text-lg">+</span>
                <span>Add Custom Color</span>
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-500">Custom Color</p>
                <div className="flex items-center gap-3">
                  {/* Color preview & picker trigger */}
                  <div className="relative">
                    <div 
                      className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-green-500 transition-colors"
                      style={{ backgroundColor: customColor }}
                      onClick={() => colorInputRef.current?.click()}
                    />
                    <input
                      ref={colorInputRef}
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  
                  {/* Hex input */}
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                        setCustomColor(val);
                      }
                    }}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                  
                  {/* Apply button */}
                  <button
                    type="button"
                    onClick={handleCustomColorApply}
                    className="px-3 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Clear option */}
          <div className="mt-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setShowPicker(false);
                setShowCustomInput(false);
              }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FormFieldSelect({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && "*"}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        required={required}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function IngredientsField({
  ingredients,
  inputValue,
  onInputChange,
  onAdd,
  onRemove,
}: {
  ingredients: string[];
  inputValue: string;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">Ingredients</label>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Add ingredient"
          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), onAdd())}
        />
        <Button type="button" onClick={onAdd} variant="outline">
          Add
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {ingredients.map((ing, i) => (
          <Badge key={i} variant="secondary" className="gap-1">
            {ing}
            <button type="button" onClick={() => onRemove(i)}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

function FormActions({
  onCancel,
  isLoading,
  submitLabel,
}: {
  onCancel: () => void;
  isLoading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            {submitLabel}
          </>
        )}
      </Button>
    </div>
  );
}
