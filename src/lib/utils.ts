import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Helper para combinar clases de Tailwind de forma segura (si decides instalar clsx y tailwind-merge después)
// Por ahora usaremos una versión simple si no están instaladas, pero dejo la estructura lista.
export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ");
}

export const calculateIMC = (weightKg: number, heightCm: number): number => {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
};

// Fórmula de Durnin/Womersley (Simplificada para demostración)
// En un caso real, esto varía según edad y género.
export const calculateBodyFat = (sumSkinfolds: number): number => {
  if (sumSkinfolds <= 0) return 0;
  // Densidad corporal aproximada
  const density = 1.1631 - 0.0632 * Math.log10(sumSkinfolds);
  // Fórmula de Siri
  const bodyFat = (495 / density) - 450;
  return Number(bodyFat.toFixed(1));
};