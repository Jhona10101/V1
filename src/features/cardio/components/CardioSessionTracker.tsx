import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Play, Pause, Send, Clock, Target, Check, X } from 'lucide-react';

// Define the structure of a cycle and the feedback
interface Cycle {
  id: number;
  level: string;
  intensity: number;
  time: number;
}

interface CycleFeedback {
  cycleId: number;
  plannedIntensity: number;
  plannedTime: number;
  intensityMet: boolean;
  timeCompleted: boolean;
}

interface CardioSessionTrackerProps {
  exercise: {
    name: string;
    videoUrl?: string;
    gifUrl?: string;
    cycles: Cycle[];
  };
  onComplete: (data: { feedback: CycleFeedback[] }) => void;
  isSubmitting: boolean;
}

// Modal component for collecting feedback after each cycle
const FeedbackModal = ({ cycle, onSave }: { cycle: any, onSave: (feedback: any) => void }) => {
  const [intensityMet, setIntensityMet] = useState<boolean | null>(null);
  const [timeCompleted, setTimeCompleted] = useState<boolean | null>(null);

  const handleSave = () => {
    if (intensityMet !== null && timeCompleted !== null) {
      onSave({ intensityMet, timeCompleted });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <Card className="w-full max-w-md m-4 bg-slate-900 border-slate-700">
        <h3 className="text-xl font-bold text-white mb-2">Feedback del Ciclo</h3>
        <p className="text-slate-400 mb-6">Registra tu rendimiento para el Ciclo completado.</p>
        
        <div className="space-y-6">
          {/* Intensity Feedback */}
          <div className="p-4 rounded-lg bg-slate-800">
            <p className="text-slate-300 mb-3">¿Alcanzaste la intensidad planeada del <strong className="text-amber-400">{cycle.intensity}%</strong>?</p>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => setIntensityMet(true)} variant={intensityMet === true ? 'primary' : 'outline'} className={`flex items-center gap-2 ${intensityMet === true ? 'bg-green-600' : ''}`}>
                <Check className="w-5 h-5" /> Sí
              </Button>
              <Button onClick={() => setIntensityMet(false)} variant={intensityMet === false ? 'primary' : 'outline'} className={`flex items-center gap-2 ${intensityMet === false ? 'bg-red-600' : ''}`}>
                <X className="w-5 h-5" /> No
              </Button>
            </div>
          </div>

          {/* Time Feedback */}
          <div className="p-4 rounded-lg bg-slate-800">
            <p className="text-slate-300 mb-3">¿Completaste los <strong className="text-sky-400">{cycle.time} segundos</strong> de duración?</p>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => setTimeCompleted(true)} variant={timeCompleted === true ? 'primary' : 'outline'} className={`flex items-center gap-2 ${timeCompleted === true ? 'bg-green-600' : ''}`}>
                <Check className="w-5 h-5" /> Sí
              </Button>
              <Button onClick={() => setTimeCompleted(false)} variant={timeCompleted === false ? 'primary' : 'outline'} className={`flex items-center gap-2 ${timeCompleted === false ? 'bg-red-600' : ''}`}>
                <X className="w-5 h-5" /> No
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={intensityMet === null || timeCompleted === null}
            className="w-full"
          >
            Guardar y Continuar
          </Button>
        </div>
      </Card>
    </div>
  );
};


export const CardioSessionTracker: React.FC<CardioSessionTrackerProps> = ({
  exercise,
  onComplete,
  isSubmitting
}) => {
  const [currentCycleIndex, setCurrentCycleIndex] = useState(0);
  const [cycleFeedback, setCycleFeedback] = useState<CycleFeedback[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentCycle = exercise.cycles?.[currentCycleIndex];
  const totalCycles = exercise.cycles?.length || 0;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && currentCycle) {
      interval = setInterval(() => {
        setElapsed(prev => {
          if (prev + 1 >= currentCycle.time) {
            clearInterval(interval);
            setIsRunning(false);
            setShowFeedbackModal(true);
            return currentCycle.time;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, currentCycle]);

  const handleSaveFeedback = (feedback: { intensityMet: boolean; timeCompleted: boolean; }) => {
    const newFeedback: CycleFeedback = {
      cycleId: currentCycle.id,
      plannedIntensity: currentCycle.intensity,
      plannedTime: currentCycle.time,
      ...feedback
    };
    setCycleFeedback([...cycleFeedback, newFeedback]);
    
    setShowFeedbackModal(false);
    
    // Move to next cycle or finish
    if (currentCycleIndex < totalCycles - 1) {
      setCurrentCycleIndex(currentCycleIndex + 1);
      setElapsed(0);
    } else {
      // Last cycle completed, ready to submit session
    }
  };

  const handleSessionComplete = async () => {
    try {
      await onComplete({ feedback: cycleFeedback });
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting session:', error);
    }
  };

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const percentComplete = currentCycle ? (elapsed / currentCycle.time) * 100 : 0;
  
  if (!currentCycle && totalCycles > 0 && cycleFeedback.length === totalCycles) {
     return (
      <Card className="bg-slate-900/50 border-slate-700 p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-emerald-400 mb-2">¡Rutina de Cardio Completada!</h3>
        <p className="text-slate-300 mb-8">Has finalizado todos los ciclos. Envía tu sesión al coach para que pueda revisar tu progreso.</p>
        <Button
          onClick={handleSessionComplete}
          disabled={isSubmitting}
          className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 text-lg"
        >
          {isSubmitting ? 'Enviando...' : <><Send className="w-5 h-5" /> Enviar Sesión al Coach</>}
        </Button>
      </Card>
    );
  }
  
  if (submitted) {
    return (
      <Card className="bg-emerald-900/20 border-emerald-500/30 p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-emerald-400 mb-2">¡Ejercicio Registrado!</h3>
        <p className="text-slate-300">Tu sesión de cardio ha sido guardada y enviada al coach para feedback.</p>
      </Card>
    );
  }
  
  if (totalCycles === 0) {
      return <Card className="p-8 text-center text-slate-400">Este ejercicio de cardio no tiene ciclos definidos.</Card>
  }

  return (
    <div className="space-y-6">
      {showFeedbackModal && <FeedbackModal cycle={currentCycle} onSave={handleSaveFeedback} />}

      {/* Cycle Info Card */}
      <Card className="bg-slate-900/50 border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">{exercise.name}</h3>
          <span className="font-mono text-lg text-slate-300">Ciclo {currentCycleIndex + 1} / {totalCycles}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center mb-6">
          <div className="bg-slate-800 p-3 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400 uppercase"><Target className="w-4 h-4 text-amber-500"/>Intensidad</div>
            <p className="text-2xl font-bold text-amber-400">{currentCycle.intensity}%</p>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400 uppercase"><Clock className="w-4 h-4 text-sky-500"/>Duración</div>
            <p className="text-2xl font-bold text-sky-400">{currentCycle.time} <span className="text-lg">s</span></p>
          </div>
        </div>
      
        {/* Timer Display */}
        <div className="text-center">
          <div className="text-6xl font-bold text-emerald-400 mb-4 font-mono">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-6">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            ></div>
          </div>
        </div>

        {/* Controles */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2 transition-colors w-40 justify-center ${
              isRunning
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isRunning ? (
              <><Pause className="w-5 h-5" /> Pausar</>
            ) : (
              <><Play className="w-5 h-5" /> {elapsed === 0 ? 'Iniciar' : 'Reanudar'}</>
            )}
          </Button>

          <Button
            onClick={() => setElapsed(0)}
            variant="secondary"
            className="w-40"
          >
            Reiniciar Ciclo
          </Button>
        </div>
      </Card>
      
      {(exercise.videoUrl || exercise.gifUrl) && (
        <Card>
          <h3 className="text-lg font-bold text-white mb-4">Demostración</h3>
          {exercise.videoUrl ? (
            <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
              <iframe width="100%" height="100%" src={exercise.videoUrl.replace('watch?v=', 'embed/')} title="Video" frameBorder="0" allowFullScreen></iframe>
            </div>
          ) : exercise.gifUrl && (
            <img src={exercise.gifUrl} alt="Demostración" className="w-full rounded-lg" />
          )}
        </Card>
      )}
    </div>
  );
};
