import { useState } from 'react';
import { Client } from '@/types';
import { ArrowLeft, TrendingUp, CheckCircle, AlertCircle, BarChart2, MessageSquare, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface ClientTrainingProgressProps {
  client: Client;
  onBack: () => void;
}

// Datos Mock para simular la base de datos de rutinas
const MOCK_WEEKLY_DATA = {
  week: 'Semana 4 - Hipertrofia',
  compliance: 82,
  totalVolumePlan: 12500,
  totalVolumeActual: 11200,
  days: [
    {
      day: 'Lunes',
      focus: 'Pierna Enfocada',
      exercises: [
        { id: 1, name: 'Sentadilla Libre', plan: { sets: 4, reps: 12, weight: 80 }, actual: { sets: 4, reps: 10, weight: 80 } },
        { id: 2, name: 'Prensa 45', plan: { sets: 3, reps: 15, weight: 120 }, actual: { sets: 3, reps: 15, weight: 130 } },
        { id: 3, name: 'Extensiones', plan: { sets: 3, reps: 20, weight: 45 }, actual: { sets: 3, reps: 20, weight: 50 } },
      ]
    },
    {
      day: 'Martes',
      focus: 'Empuje (Pecho/Hombro)',
      exercises: [
        { id: 4, name: 'Press Banca', plan: { sets: 4, reps: 10, weight: 70 }, actual: { sets: 4, reps: 10, weight: 70 } },
        { id: 5, name: 'Press Militar', plan: { sets: 3, reps: 12, weight: 40 }, actual: { sets: 3, reps: 8, weight: 40 } },
      ]
    }
  ]
};

export const ClientTrainingProgress = ({ client, onBack }: ClientTrainingProgressProps) => {
  const [expandedDay, setExpandedDay] = useState<string | null>('Lunes');

  const toggleDay = (day: string) => setExpandedDay(expandedDay === day ? null : day);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Seguimiento Semanal</h1>
            <p className="text-slate-400 text-sm">Análisis de rendimiento: {MOCK_WEEKLY_DATA.week}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-lg border border-slate-800">
          <span className="text-slate-400 text-xs uppercase font-bold">Cumplimiento Global:</span>
          <span className={`font-bold ${MOCK_WEEKLY_DATA.compliance >= 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {MOCK_WEEKLY_DATA.compliance}%
          </span>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900/50 border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg"><BarChart2 className="w-6 h-6 text-blue-500" /></div>
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">Volumen Total (Kg)</p>
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-white">{MOCK_WEEKLY_DATA.totalVolumeActual.toLocaleString()}</span>
                <span className="text-xs text-slate-500 mb-1">/ {MOCK_WEEKLY_DATA.totalVolumePlan.toLocaleString()} Plan</span>
              </div>
              {/* Barra de progreso visual */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${(MOCK_WEEKLY_DATA.totalVolumeActual / MOCK_WEEKLY_DATA.totalVolumePlan) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </Card>
        
        <Card className="bg-slate-900/50 border-slate-800 md:col-span-2">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg"><MessageSquare className="w-6 h-6 text-purple-500" /></div>
            <div className="w-full">
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Feedback para el Atleta</p>
              <textarea 
                placeholder="Escribe aquí tus sugerencias para la próxima semana..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-purple-500 outline-none h-20 resize-none"
              ></textarea>
              <div className="flex justify-end mt-2">
                <button className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-md transition-colors">Enviar Feedback</button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Detalle por Día */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-emerald-500" />
          Detalle de Sesiones
        </h2>
        
        {MOCK_WEEKLY_DATA.days.map((day) => (
          <div key={day.day} className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/30">
            <button 
              onClick={() => toggleDay(day.day)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${day.exercises.every(e => e.actual.reps >= e.plan.reps) ? 'bg-emerald-500' : 'bg-yellow-500'}`}></div>
                <span className="font-bold text-white">{day.day}</span>
                <span className="text-sm text-slate-400">- {day.focus}</span>
              </div>
              {expandedDay === day.day ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
            </button>

            {expandedDay === day.day && (
              <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                <div className="grid grid-cols-12 gap-4 text-xs text-slate-500 uppercase font-bold mb-3 px-2">
                  <div className="col-span-4">Ejercicio</div>
                  <div className="col-span-3 text-center">Planificado</div>
                  <div className="col-span-3 text-center">Realizado</div>
                  <div className="col-span-2 text-center">Diferencia</div>
                </div>
                <div className="space-y-2">
                  {day.exercises.map((ex) => {
                    const isUnderPerforming = ex.actual.reps < ex.plan.reps || ex.actual.weight < ex.plan.weight;
                    return (
                      <div key={ex.id} className="grid grid-cols-12 gap-4 items-center p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <div className="col-span-4 font-medium text-white">{ex.name}</div>
                        <div className="col-span-3 text-center text-slate-400">
                          {ex.plan.sets}x{ex.plan.reps} <span className="text-xs">@ {ex.plan.weight}kg</span>
                        </div>
                        <div className="col-span-3 text-center text-white font-bold">
                          {ex.actual.sets}x{ex.actual.reps} <span className="text-xs">@ {ex.actual.weight}kg</span>
                        </div>
                        <div className="col-span-2 flex justify-center">
                          {isUnderPerforming ? (
                            <span className="flex items-center gap-1 text-red-400 text-xs font-bold"><AlertCircle className="w-3 h-3" /> Bajo</span>
                          ) : (
                            <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold"><CheckCircle className="w-3 h-3" /> OK</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};