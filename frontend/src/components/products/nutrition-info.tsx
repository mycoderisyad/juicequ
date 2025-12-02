/**
 * Nutrition info component for product details
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Flame, Droplets, Dumbbell, Cookie, Apple, Leaf } from "lucide-react";

interface NutritionData {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  sugar?: number;
  fiber?: number;
  vitamin_c?: number;
  vitamin_a?: number;
}

interface NutritionInfoProps {
  nutrition: NutritionData;
  className?: string;
  compact?: boolean;
}

interface NutrientItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit: string;
  color: string;
}

function NutrientItem({ icon, label, value, unit, color }: NutrientItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          color
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold text-gray-900">
          {value}
          <span className="text-xs text-gray-500">{unit}</span>
        </p>
      </div>
    </div>
  );
}

export function NutritionInfo({
  nutrition,
  className,
  compact = false,
}: NutritionInfoProps) {
  const nutrients = [
    {
      icon: <Flame className="h-5 w-5 text-orange-600" />,
      label: "Calories",
      value: nutrition.calories ?? 0,
      unit: " kcal",
      color: "bg-orange-100",
      show: nutrition.calories !== undefined,
    },
    {
      icon: <Dumbbell className="h-5 w-5 text-red-600" />,
      label: "Protein",
      value: nutrition.protein ?? 0,
      unit: "g",
      color: "bg-red-100",
      show: nutrition.protein !== undefined,
    },
    {
      icon: <Cookie className="h-5 w-5 text-yellow-600" />,
      label: "Carbs",
      value: nutrition.carbs ?? 0,
      unit: "g",
      color: "bg-yellow-100",
      show: nutrition.carbs !== undefined,
    },
    {
      icon: <Droplets className="h-5 w-5 text-blue-600" />,
      label: "Fat",
      value: nutrition.fat ?? 0,
      unit: "g",
      color: "bg-blue-100",
      show: nutrition.fat !== undefined,
    },
    {
      icon: <Apple className="h-5 w-5 text-pink-600" />,
      label: "Sugar",
      value: nutrition.sugar ?? 0,
      unit: "g",
      color: "bg-pink-100",
      show: nutrition.sugar !== undefined,
    },
    {
      icon: <Leaf className="h-5 w-5 text-green-600" />,
      label: "Fiber",
      value: nutrition.fiber ?? 0,
      unit: "g",
      color: "bg-green-100",
      show: nutrition.fiber !== undefined,
    },
  ];

  const visibleNutrients = nutrients.filter((n) => n.show);

  if (visibleNutrients.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {visibleNutrients.slice(0, 4).map((nutrient) => (
          <div
            key={nutrient.label}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1",
              nutrient.color
            )}
          >
            {nutrient.icon}
            <span className="text-sm font-medium text-gray-700">
              {nutrient.value}
              {nutrient.unit}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="font-semibold text-gray-900">Nutrition Information</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleNutrients.map((nutrient) => (
          <NutrientItem
            key={nutrient.label}
            icon={nutrient.icon}
            label={nutrient.label}
            value={nutrient.value}
            unit={nutrient.unit}
            color={nutrient.color}
          />
        ))}
      </div>
    </div>
  );
}

// Health benefits component
interface HealthBenefit {
  title: string;
  description: string;
  icon: string;
}

interface HealthBenefitsProps {
  benefits: string[] | HealthBenefit[];
  className?: string;
}

export function HealthBenefits({ benefits, className }: HealthBenefitsProps) {
  if (!benefits || benefits.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="font-semibold text-gray-900">Health Benefits</h3>
      <div className="flex flex-wrap gap-2">
        {benefits.map((benefit, index) => {
          const text = typeof benefit === "string" ? benefit : benefit.title;
          return (
            <span
              key={index}
              className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm text-green-700"
            >
              <span className="mr-1" aria-hidden="true">
                ✓
              </span>
              {text}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// Ingredients component
interface IngredientsProps {
  ingredients: string[] | string;
  className?: string;
}

export function Ingredients({ ingredients, className }: IngredientsProps) {
  let ingredientList: string[] = [];

  if (typeof ingredients === "string") {
    try {
      ingredientList = JSON.parse(ingredients);
    } catch {
      ingredientList = ingredients.split(",").map((s) => s.trim());
    }
  } else if (Array.isArray(ingredients)) {
    ingredientList = ingredients;
  }

  if (ingredientList.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="font-semibold text-gray-900">Ingredients</h3>
      <div className="flex flex-wrap gap-2">
        {ingredientList.map((ingredient, index) => (
          <span
            key={index}
            className="rounded-full border border-gray-200 px-4 py-1 text-sm text-gray-600"
          >
            {ingredient}
          </span>
        ))}
      </div>
    </div>
  );
}

export default NutritionInfo;
