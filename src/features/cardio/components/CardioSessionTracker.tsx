import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Play, Pause, Square, Send, Clock, Zap } from 'lucide-react';

interface CardioSessionTrackerProps {
  exercise: any;
  plannedDuration: number;
  plannedIntensity: string;
  onComplete: (data: {
    actualDuration: number;
    actualIntensity: string;
    notes: string;
  }) => void;
  isSubmitting: boolean;
}

export const CardioSessionTracker = ({
  exercise,
  plannedDuration,
  plannedIntensity,
  onComplete,
  isSubmitting
}: CardioSessionTrackerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [intensity, setIntensity] = useState(plannedIntensity);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const percentComplete = (minutes / plannedDuration) * 100;

  const handleComplete = async () => {
    const actualDuration = Math.round(elapsed / 60);
    
    try {
      await onComplete({
        actualDuration,
        actualIntensity: intensity,
        notes
      });
      setSubmitted(true);
      setIsRunning(false);
    } catch (error) {
      console.error('Error submitting exercise:', error);
    }
  };

  if (submitted) {
    return (
      <Card className="bg-emerald-900/20 border-emerald-500/30 p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-emerald-400 mb-2">¡Ejercicio Registrado!</h3>
        <p className="text-slate-300">Tu sesión de cardio ha sido guardada y enviada al coach para feedback.</p>
        <div className="mt-6 space-y-2 text-sm text-slate-400">
          <p><strong>Duración:</strong> {minutes} min {seconds} seg</p>
          <p><strong>Intensidad:</strong> {intensity}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Video Tutorial */}
      {exercise.videoUrl && (
        <Card>
          <h3 className="text-lg font-bold text-white mb-4">Tutorial de Técnica</h3>
          <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={exercise.videoUrl.replace('watch?v=', 'embed/')}
              title="Video tutorial"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </Card>
      )}

      {/* GIF Demostración */}
      {exercise.gifUrl && !exercise.videoUrl && (
        <Card>
          <h3 className="text-lg font-bold text-white mb-4">Demostración del Ejercicio</h3>
          <img 
            src={exercise.gifUrl}
            alt="Demostración"
            className="w-full h-48 rounded-lg object-cover"
          />
        </Card>
      )}

      {/* Timer Card */}
      <Card className="bg-slate-900/50 border-slate-700">
        <div className="space-y-6">
          {/* Timer Display */}
          <div className="text-center">
            <div className="text-6xl font-bold text-emerald-400 mb-4 font-mono">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <p className="text-slate-400 mb-6">de {plannedDuration} minutos planeados</p>
            
            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-6">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${Math.min(percentComplete, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Controles */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors ${
                isRunning
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  {elapsed === 0 ? 'Iniciar' : 'Reanudar'}
                </>
              )}
            </button>

            <button
              onClick={() => {
                setElapsed(0);
                setIsRunning(false);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors"
            >
              <Square className="w-5 h-5" />
              Reiniciar
            </button>
          </div>
        </div>
      </Card>

      {/* Datos de Entrada */}
      <Card>
        <h3 className="text-lg font-bold text-white mb-6">Información de la Sesión</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Intensidad Actual */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Intensidad Utilizada
            </label>
            <select
              value={intensity}
              onChange={(e) => setIntensity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors appearance-none"
            >
              <option value="Baja">Baja</option>
              <option value="Moderada">Moderada</option>
              <option value="Alta">Alta</option>
            </select>
            <p className="text-xs text-slate-500">Planeado: {plannedIntensity}</p>
          </div>

          {/* Duración Actual */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Duración Completada
            </label>
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white font-mono">
              {minutes}:{String(seconds).padStart(2, '0')} min
            </div>
            <p className="text-xs text-slate-500">Planeado: {plannedDuration} min</p>
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-2 mt-6">
          <label className="text-sm font-bold text-slate-400 uppercase">Notas Adicionales</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Sentí muy bueno, sin molestias..."
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-emerald-500 outline-none transition-colors resize-none"
          />
        </div>
      </Card>

      {/* Botón de Envío */}
      <button
        onClick={handleComplete}
        disabled={isSubmitting || elapsed === 0}
        className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Enviar Sesión al Coach
          </>
        )}
      </button>
    </div>
  );
};

import React from 'react';
