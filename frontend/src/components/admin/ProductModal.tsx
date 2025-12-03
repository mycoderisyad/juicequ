"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Check, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
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
}

function getInitialFormData(product: Product | null, categories: Category[]): FormData {
  if (product) {
    return {
      name: product.name,
      description: product.description,
      price: product.price || product.base_price || 0,
      category: product.category || product.category_id || "",
      is_available: product.is_available,
      stock: product.stock ?? 100,
      ingredients: product.ingredients || [],
      image: product.image || product.image_color || "",
      hero_image: product.hero_image || "",
      bottle_image: product.bottle_image || "",
      thumbnail_image: product.thumbnail_image || "",
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
            <FormFieldNumber
              label="Price (Rp)"
              value={formData.price}
              onChange={(v) => updateField("price", v)}
              step={1000}
              min={0}
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
            <FormFieldText
              label="Image Color Class"
              value={formData.image}
              onChange={(v) => updateField("image", v)}
              placeholder="e.g., bg-red-500"
            />
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
