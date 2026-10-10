import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const money = (n) => `PKR ${Number(n || 0).toLocaleString()}`;
