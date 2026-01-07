import { Card } from '@/components/ui/Card';
import { MessageCircle, Calendar, Zap, Clock, User } from 'lucide-react';

interface CardioHistoryEntry {
  id: string;
  exerciseName: string;
  date: string;
  time: string;
  plannedDuration: number;
  actualDuration: number;
  plannedIntensity: string;
  actualIntensity: string;
  notes?: string;
  feedback?: string;
  coachName?: string;
}

interface CardioHistoryFeedbackProps {
  entries: CardioHistoryEntry[];
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

  if (entries.length === 0) {
    return (
      <Card className="text-center py-12">
        <MessageCircle className="w-12 h-12 mx-auto text-slate-600 mb-4" />
        <h3 className="text-lg font-bold text-slate-300 mb-2">Sin Historial Aún</h3>
        <p className="text-slate-500">Cuando completes ejercicios cardiovasculares, aquí aparecerá el feedback de tu entrenador.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        <MessageCircle className="w-6 h-6 text-emerald-500" />
        Historial y Feedback
      </h3>

      {entries.map((entry) => (
        <Card key={entry.id} className={`border-l-4 ${entry.feedback ? 'border-l-emerald-500 bg-emerald-900/10' : 'border-l-slate-600'}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold text-white">{entry.exerciseName}</h4>
              <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4" />
                {new Date(entry.date).toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} a las {entry.time.split('T')?.[1]?.slice(0, 5) || entry.time}
              </p>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold uppercase">
                Completado
              </div>
            </div>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-slate-900/50 rounded-lg">
            {/* Duración */}
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4" />
                Duración
              </p>
              <p className="text-white font-bold">
                {entry.actualDuration} min 
                <span className="text-slate-500 text-sm ml-2">(planeado: {entry.plannedDuration} min)</span>
              </p>
            </div>

            {/* Intensidad */}
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4" />
                Intensidad
              </p>
              <p className="text-white font-bold">
                {entry.actualIntensity}
                <span className="text-slate-500 text-sm ml-2">(planeada: {entry.plannedIntensity})</span>
              </p>
            </div>
          </div>

          {/* Notas del Cliente */}
          {entry.notes && (
            <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-400 uppercase font-bold mb-2">Tus Notas</p>
              <p className="text-slate-300 text-sm">{entry.notes}</p>
            </div>
          )}

          {/* Feedback del Coach */}
          {entry.feedback ? (
            <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
              <p className="text-xs text-emerald-400 uppercase font-bold mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Feedback de {entry.coachName || 'tu entrenador'}
              </p>
              <p className="text-slate-300 text-sm">{entry.feedback}</p>
            </div>
          ) : (
            <div className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg">
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Esperando Feedback del Coach...</p>
              <p className="text-slate-400 text-sm">Tu entrenador revisará esta sesión y agregará sus comentarios pronto.</p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
