import { useMemo } from 'react';

// Fórmula de Faulkner para % de Grasa (simplificada)
const calculateBodyFatFaulkner = (
  triceps: number,
  subscapular: number,
  suprailiac: number,
  biceps: number
): number => {
  if (triceps <= 0 || subscapular <= 0 || suprailiac <= 0 || biceps <= 0) {
    return 0;
  }
  const sumOfFolds = triceps + subscapular + suprailiac + biceps;
  const bodyFat = (sumOfFolds * 0.153) + 5.783;
  return parseFloat(bodyFat.toFixed(2));
};

export const useAnthropometricCalculations = (
  weightKg: number,
  heightCm: number,
  folds: { triceps: number; subscapular: number; suprailiac: number; biceps: number }
) => {
  return useMemo(() => {
    const heightM = heightCm / 100;

    // 1. Cálculo del IMC
    const imc = heightM > 0 ? weightKg / (heightM * heightM) : 0;

    // 2. Cálculo del % de Grasa
    const bodyFatPercentage = calculateBodyFatFaulkner(
      folds.triceps,
      folds.subscapular,
      folds.suprailiac,
      folds.biceps
    );

    // 3. Cálculo de Masa Magra
    const fatMass = weightKg * (bodyFatPercentage / 100);
    const leanMassKg = weightKg - fatMass;

    return {
      imc: parseFloat(imc.toFixed(2)),
      bodyFatPercentage,
      leanMassKg: parseFloat(leanMassKg.toFixed(2)),
    };
  }, [weightKg, heightCm, folds]);
};