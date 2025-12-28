import { Client } from '@/types';
import { ArrowLeft, Save, Activity, Ruler, Timer } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface ClientPhysicalTestsProps {
  client: Client;
  onBack: () => void;
}

export const ClientPhysicalTests = ({ client, onBack }: ClientPhysicalTestsProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Tests Físicos</h1>
            <p className="text-slate-400">Evaluación de {client.firstName} {client.lastName}</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium">
          <Save className="w-4 h-4" />
          Guardar Resultados
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Composición Corporal */}
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Ruler className="w-5 h-5 text-blue-500" />
            Composición Corporal
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-500 uppercase font-bold">Peso (kg)</label>
              <input type="number" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none" placeholder="0.0" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500 uppercase font-bold">% Grasa</label>
              <input type="number" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none" placeholder="0.0" />
            </div>
          </div>
        </Card>

        {/* Resistencia Cardiovascular */}
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-500" />
            Cardiovascular (VO2 Max)
          </h3>
          <div className="space-y-1">
            <label className="text-xs text-slate-500 uppercase font-bold">Test de Cooper (metros)</label>
            <input type="number" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-red-500 outline-none" placeholder="Distancia en 12 min" />
          </div>
        </Card>

        {/* Fuerza */}
        <Card className="space-y-4 md:col-span-2">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Timer className="w-5 h-5 text-purple-500" />
            Tests de Fuerza (1RM Estimado)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['Sentadilla', 'Press Banca', 'Peso Muerto'].map((exercise) => (
              <div key={exercise} className="space-y-1">
                <label className="text-xs text-slate-500 uppercase font-bold">{exercise} (kg)</label>
                <input type="number" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none" placeholder="0" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};