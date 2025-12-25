'use client';

import React, { useState } from 'react';
import { useAnthropometricCalculations } from '../hooks/useAnthropometricCalculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Valores iniciales del formulario para un nuevo registro
const initialState = {
  weightKg: 70,
  heightCm: 175,
  tricepsSkinfold: 10,
  subscapularSkinfold: 15,
  suprailiacSkinfold: 12,
  bicepsSkinfold: 8,
};

export const AntropometriaForm = () => {
  const [measurements, setMeasurements] = useState(initialState);

  const { imc, bodyFatPercentage, leanMassKg } = useAnthropometricCalculations(
    measurements.weightKg,
    measurements.heightCm,
    {
      triceps: measurements.tricepsSkinfold,
      subscapular: measurements.subscapularSkinfold,
      suprailiac: measurements.suprailiacSkinfold,
      biceps: measurements.bicepsSkinfold,
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, valueAsNumber } = e.target;
    setMeasurements((prev) => ({ ...prev, [name]: valueAsNumber || 0 }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Columna de Inputs */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Registro Antropométrico</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="weightKg">Peso (kg)</Label>
            <Input id="weightKg" name="weightKg" type="number" value={measurements.weightKg} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heightCm">Altura (cm)</Label>
            <Input id="heightCm" name="heightCm" type="number" value={measurements.heightCm} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tricepsSkinfold">Pliegue Tríceps (mm)</Label>
            <Input id="tricepsSkinfold" name="tricepsSkinfold" type="number" value={measurements.tricepsSkinfold} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subscapularSkinfold">Pliegue Subescapular (mm)</Label>
            <Input id="subscapularSkinfold" name="subscapularSkinfold" type="number" value={measurements.subscapularSkinfold} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="suprailiacSkinfold">Pliegue Supraíliaco (mm)</Label>
            <Input id="suprailiacSkinfold" name="suprailiacSkinfold" type="number" value={measurements.suprailiacSkinfold} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bicepsSkinfold">Pliegue Bíceps (mm)</Label>
            <Input id="bicepsSkinfold" name="bicepsSkinfold" type="number" value={measurements.bicepsSkinfold} onChange={handleChange} />
          </div>
        </CardContent>
      </Card>
      
      {/* Columna de Resultados en Tiempo Real */}
      <Card className="lg:col-span-1 bg-slate-900 text-white">
        <CardHeader>
          <CardTitle>Resultados en Tiempo Real</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-400">IMC</p>
            <p className="text-4xl font-bold tracking-tighter">{imc}</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-400">% Grasa Corporal</p>
            <p className="text-4xl font-bold tracking-tighter">{bodyFatPercentage}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-400">Masa Magra</p>
            <p className="text-4xl font-bold tracking-tighter">{leanMassKg} kg</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};