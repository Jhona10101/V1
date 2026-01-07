import { Card } from '@/components/ui/Card';
import { CheckCircle } from 'lucide-react';

interface CardioExerciseFormProps {
  exercise: any;
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isEditing: boolean;
}

export const CardioExerciseForm = ({
  exercise,
  onChange,
  onSubmit,
  isLoading,
  isEditing
}: CardioExerciseFormProps) => {
  const equipmentOptions = [
    'Cinta de Correr',
    'Bicicleta Estática',
    'Bicicleta Recumbente',
    'Elíptica',
    'Máquina de Remo',
    'StairMaster',
    'Otra'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-bold text-white mb-6">Información Básica</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Título del Ejercicio */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase">Título del Ejercicio</label>
            <input
              type="text"
              value={exercise.title || ''}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="Ej: Cardio en Bicicleta"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
            />
          </div>

          {/* Equipo/Máquina */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase">Equipo/Máquina</label>
            <select
              value={exercise.equipment || ''}
              onChange={(e) => onChange('equipment', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors appearance-none"
            >
              <option value="">Seleccionar equipo</option>
              {equipmentOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Último Mantenimiento */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase">Último Mantenimiento</label>
            <input
              type="date"
              value={exercise.lastMaintenance || ''}
              onChange={(e) => onChange('lastMaintenance', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
            />
          </div>

          {/* Próximo Mantenimiento */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase">Próximo Mantenimiento</label>
            <input
              type="date"
              value={exercise.nextMaintenance || ''}
              onChange={(e) => onChange('nextMaintenance', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-white mb-6">Valores Predeterminados</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Duración Predeterminada */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase">Duración Predeterminada (min)</label>
            <input
              type="number"
              min="1"
              max="180"
              value={exercise.defaultDuration || 20}
              onChange={(e) => onChange('defaultDuration', parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
            />
          </div>

          {/* Intensidad Predeterminada */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase">Intensidad Predeterminada</label>
            <select
              value={exercise.defaultIntensity || 'Moderada'}
              onChange={(e) => onChange('defaultIntensity', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors appearance-none"
            >
              <option value="Baja">Baja</option>
              <option value="Moderada">Moderada</option>
              <option value="Alta">Alta</option>
            </select>
          </div>

          {/* Descanso Predeterminado */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase">Descanso (seg)</label>
            <input
              type="number"
              min="0"
              max="300"
              step="10"
              value={exercise.defaultRestTime || 60}
              onChange={(e) => onChange('defaultRestTime', parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-white mb-6">Multimedia</h3>
        
        <div className="space-y-6">
          {/* URL del GIF */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase">URL del GIF (Demostración)</label>
            <input
              type="url"
              value={exercise.gifUrl || ''}
              onChange={(e) => onChange('gifUrl', e.target.value)}
              placeholder="https://example.com/exercise.gif"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
            />
            {exercise.gifUrl && (
              <div className="mt-3 p-3 bg-slate-900 rounded-lg">
                <img 
                  src={exercise.gifUrl} 
                  alt="Demostración" 
                  className="max-w-full h-48 rounded-lg object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23374151" width="200" height="200"/%3E%3Ctext x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-size="12"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            )}
          </div>

          {/* URL del Video YouTube */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase">URL del Video (YouTube)</label>
            <input
              type="url"
              value={exercise.videoUrl || ''}
              onChange={(e) => onChange('videoUrl', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors"
            />
            <p className="text-xs text-slate-500">Ingresa el enlace completo de YouTube</p>
          </div>
        </div>
      </Card>

      {/* Botón de Acción */}
      <div className="flex gap-4">
        <button
          onClick={onSubmit}
          disabled={isLoading || !exercise.title}
          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              {isEditing ? 'Actualizar Ejercicio' : 'Crear Ejercicio Cardiovascular'}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
