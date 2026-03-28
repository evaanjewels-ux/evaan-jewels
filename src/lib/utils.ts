import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Floor a price to the nearest ₹10 for display.
 * e.g. 63,887.3 → 63,880
 */
export function roundToTen(value: number): number {
  return Math.floor(value / 10) * 10;
}

/**
 * Format number as Indian Rupee currency
 */
export function formatCurrency(amount: number): string {
  const safeAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

/**
 * Format number for PDF (no ₹ symbol — Helvetica doesn't support it)
 */
export function formatCurrencyPDF(amount: number): string {
  const safeAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

/**
 * Generate a URL-friendly slug from a string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate product code like "AJ-R-001"
 */
export function generateProductCode(
  categorySlug: string,
  sequence: number
): string {
  const prefix = categorySlug.substring(0, 1).toUpperCase();
  return `AJ-${prefix}-${String(sequence).padStart(3, "0")}`;
}

/**
 * Generate bill number like "AJ-2026-0001"
 */
export function generateBillNumber(year: number, sequence: number): string {
  return `AJ-${year}-${String(sequence).padStart(4, "0")}`;
}
