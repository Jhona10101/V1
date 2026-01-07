import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { X, CheckCircle } from 'lucide-react';
import { calculate1RMAverage } from '@/services/api/firestore';

interface OneRmCalculatorProps {
  exerciseName: string;
  onCalculate: (oneRmKg: number, weightUsed: number, reps: number, calculations: any) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export const OneRmCalculator = ({ exerciseName, onCalculate, onClose, isLoading = false }: OneRmCalculatorProps) => {
  const [weight, setWeight] = useState<number>(0);
  const [reps, setReps] = useState<number>(0);
  const [calculations, setCalculations] = useState<any>(null);
  const [step, setStep] = useState<'input' | 'results'>('input');

  const handleCalculate = () => {
    if (weight <= 0 || reps <= 0) {
      alert('Por favor ingresa peso y repeticiones válidos');
      return;
    }

    const results = calculate1RMAverage(weight, reps);
    setCalculations(results);
    setStep('results');
  };

  const handleConfirm = () => {
    if (calculations) {
      onCalculate(calculations.average, weight, reps, calculations);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Calcular 1RM - {exerciseName}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6">
          {step === 'input' ? (
            <div className="space-y-6">
              <p className="text-slate-400 text-sm">
                Ingresa el peso que levantaste y la cantidad de repeticiones que completaste. El sistema calculará tu 1RM usando 7 fórmulas científicas diferentes.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">Peso (kg)</label>
                  <input
                    type="number"
                    value={weight || ''}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    placeholder="Ej: 80"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-300">Repeticiones</label>
                  <input
                    type="number"
                    value={reps || ''}
                    onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                    placeholder="Ej: 5"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-blue-300">
                  <span className="font-bold">Tip:</span> Usa pesos con los que puedas completar el rango de repeticiones (3-10 reps es ideal para mayor precisión).
                </p>
              </div>

              <button
                onClick={handleCalculate}
                disabled={weight <= 0 || reps <= 0 || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
              >
                Calcular 1RM
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resultado Principal */}
              <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/30 border border-emerald-500/30 rounded-lg p-6 text-center">
                <p className="text-emerald-300 text-sm font-bold uppercase mb-2">Tu Estimación 1RM</p>
                <h3 className="text-5xl font-bold text-emerald-400 mb-1">{calculations.average} kg</h3>
                <p className="text-slate-400 text-sm">Promedio de 7 métodos de cálculo científicos</p>
              </div>

              {/* Datos del Test */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Peso utilizado:</span>
                  <span className="text-white font-bold">{weight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Repeticiones:</span>
                  <span className="text-white font-bold">{reps} reps</span>
                </div>
              </div>

              {/* Detalles de Cálculos por Autor */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-300 uppercase">Detalle por Autor</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'Brzycki', key: 'brzycki' },
                    { name: 'Eppley', key: 'eppley' },
                    { name: 'Lander', key: 'lander' },
                    { name: 'Mayhew', key: 'mayhew' },
                    { name: 'Wathen', key: 'wathen' },
                    { name: "O'Connor", key: 'oConner' },
                    { name: 'Lombardi', key: 'lombardi' },
                  ].map(author => (
                    <div key={author.key} className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-1">{author.name}</p>
                      <p className="text-lg font-bold text-white">{calculations[author.key]} kg</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('input')}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                >
                  Recalcular
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  {isLoading ? 'Guardando...' : 'Guardar 1RM'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
