import { Card } from '@/components/ui/Card';
import { MessageCircle, Calendar, CheckCircle2, XCircle, User } from 'lucide-react';

// Updated interface to match the new data structure from firestore
interface CycleFeedbackData {
  plannedIntensity: number;
  plannedTime: number;
  intensityMet: boolean;
  timeCompleted: boolean;
}

interface CardioSessionEntry {
  id: string;
  exerciseName: string;
  createdAt: { toDate: () => Date }; // Firestore Timestamp
  cycleFeedback: CycleFeedbackData[];
  // Coach feedback fields can be added here later
  feedback?: string; 
  coachName?: string;
}

interface CardioHistoryFeedbackProps {
  entries: CardioSessionEntry[];
  isLoading?: boolean;
}

export const CardioHistoryFeedback = ({ entries, isLoading = false }: CardioHistoryFeedbackProps) => {
  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </Card>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <Card className="text-center py-12">
        <MessageCircle className="w-12 h-12 mx-auto text-slate-600 mb-4" />
        <h3 className="text-lg font-bold text-slate-300 mb-2">Sin Historial Aún</h3>
        <p className="text-slate-500">Cuando se completen ejercicios cardiovasculares, aquí aparecerá el historial detallado.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        <MessageCircle className="w-6 h-6 text-emerald-500" />
        Historial y Feedback de Cardio
      </h3>

      {entries.map((entry) => (
        <Card key={entry.id} className="border-l-4 border-l-sky-500 bg-slate-900/50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-white">{entry.exerciseName}</h4>
              <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                {entry.createdAt.toDate().toLocaleDateString('es-ES', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {/* Cycles Summary Table */}
          <div className="mb-4">
             <p className="text-xs text-slate-400 uppercase font-bold mb-2">Resumen de Ciclos</p>
             <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-800 text-xs text-slate-400 uppercase">
                        <tr>
                            <th className="px-4 py-2 rounded-l-lg">Ciclo</th>
                            <th className="px-4 py-2 text-center">Intensidad Planeada</th>
                            <th className="px-4 py-2 text-center">Rendimiento (Int.)</th>
                            <th className="px-4 py-2 text-center">Tiempo Planeado</th>
                            <th className="px-4 py-2 text-center rounded-r-lg">Rendimiento (Tiempo)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {entry.cycleFeedback.map((cycle, index) => (
                            <tr key={index} className="bg-slate-900">
                                <td className="px-4 py-3 font-medium text-white">#{index + 1}</td>
                                <td className="px-4 py-3 text-center text-amber-400 font-mono">{cycle.plannedIntensity}%</td>
                                <td className="px-4 py-3 text-center">
                                    {cycle.intensityMet ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500 inline-block" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-500 inline-block" />
                                    )}
                                </td>
                                <td className="px-4 py-3 text-center text-sky-400 font-mono">{cycle.plannedTime}s</td>
                                <td className="px-4 py-3 text-center">
                                    {cycle.timeCompleted ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500 inline-block" />
                                    ) : (
                                        <XCircle className="w-5 h-5 text-red-500 inline-block" />
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          </div>


          {/* Feedback del Coach (placeholder for future) */}
          {entry.feedback ? (
            <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
              <p className="text-xs text-emerald-400 uppercase font-bold mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Feedback de {entry.coachName || 'tu entrenador'}
              </p>
              <p className="text-slate-300 text-sm">{entry.feedback}</p>
            </div>
          ) : (
            <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <p className="text-slate-400 text-sm">Aún no hay feedback del entrenador para esta sesión.</p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

