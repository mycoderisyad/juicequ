/**
 * Utility functions for class names
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 * Handles conflicts and combines class names intelligently
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
