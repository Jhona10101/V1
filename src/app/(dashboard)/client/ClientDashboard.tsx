import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Calendar, TrendingUp, MessageCircle, Play, ChevronRight, Dumbbell, Star, BarChart, ArrowLeft, Clock, PlayCircle, PauseCircle, SkipForward, CheckCircle2, X, ChevronDown, ChevronUp, CalendarDays, Trophy, AlertTriangle, RefreshCw, PlusCircle } from 'lucide-react';

// Mock Data para la rutina activa
const ACTIVE_ROUTINE = [
  { 
    id: 1, 
    name: 'Sentadilla Libre (Squat)', 
    sets: 4, 
    reps: 10, 
    weight: 80, 
    gif: 'https://media.giphy.com/media/l41Yy4J96X8ehz8xG/giphy.gif', // Sentadilla
    notes: 'Romper el paralelo. Mantener espalda recta.'
  },
  { 
    id: 2, 
    name: 'Press de Banca', 
    sets: 4, 
    reps: 12, 
    weight: 60, 
    gif: 'https://media.giphy.com/media/3o6Zt9y2JCjc450T3q/giphy.gif', // Press Banca
    notes: 'Controlar la bajada. Codos a 45 grados.'
  },
  { 
    id: 3, 
    name: 'Peso Muerto Rumano', 
    sets: 3, 
    reps: 12, 
    weight: 90, 
    gif: 'https://media.giphy.com/media/pS6qtLCzVqW08/giphy.gif', // Peso Muerto
    notes: 'Enfocar en isquios. No curvar espalda.'
  },
];

// Plan Semanal Inicial
const INITIAL_WEEKLY_PLAN = [
  { id: 'mon', day: 'Lunes', title: 'Pierna Enfocada', type: 'training', isCompleted: false },
  { id: 'tue', day: 'Martes', title: 'Empuje (Push)', type: 'training', isCompleted: false },
  { id: 'wed', day: 'Miércoles', title: 'Descanso Activo', type: 'rest', isCompleted: false },
  { id: 'thu', day: 'Jueves', title: 'Tracción (Pull)', type: 'training', isCompleted: false },
  { id: 'fri', day: 'Viernes', title: 'Full Body', type: 'training', isCompleted: false },
  { id: 'sat', day: 'Sábado', title: 'Cardio LISS', type: 'cardio', isCompleted: false },
  { id: 'sun', day: 'Domingo', title: 'Descanso Total', type: 'rest', isCompleted: false },
];

const WorkoutSession = ({ onExit, onComplete }: { onExit: () => void; onComplete: (results: any) => void }) => {
  const [started, setStarted] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [finished, setFinished] = useState(false);

  // Estados para Feedback (Inputs del usuario)
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [inputReps, setInputReps] = useState(0);
  const [inputWeight, setInputWeight] = useState(0);
  const [sessionResults, setSessionResults] = useState<any[]>([]);

  useEffect(() => {
    let interval: any;
    if (started && !isPaused && !finished) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [started, isPaused, finished]);

  // Inicializar inputs con los valores planificados al cambiar de ejercicio
  useEffect(() => {
    const ex = ACTIVE_ROUTINE[currentExerciseIndex];
    if (ex) {
      setInputReps(ex.reps);
      setInputWeight(ex.weight);
    }
  }, [currentExerciseIndex]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const handleNext = () => {
    // Al dar siguiente, pausamos y pedimos feedback
    setIsPaused(true);
    setFeedbackMode(true);
  };

  const confirmResultAndNext = () => {
    // Guardamos el resultado (Aquí se enviaría a la BD)
    const result = {
      exerciseId: ACTIVE_ROUTINE[currentExerciseIndex].id,
      planned: { reps: ACTIVE_ROUTINE[currentExerciseIndex].reps, weight: ACTIVE_ROUTINE[currentExerciseIndex].weight },
      actual: { reps: inputReps, weight: inputWeight }
    };
    setSessionResults([...sessionResults, result]);
    setFeedbackMode(false);

    if (currentExerciseIndex < ACTIVE_ROUTINE.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      // Mantenemos pausado para el descanso, el usuario reanuda manualmente
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    const motivationalQuotes = [
      "¡Excelente trabajo! Cada repetición cuenta.",
      "¡Sigue así! La constancia es la clave del éxito.",
      "¡Entrenamiento destruido! Estás un paso más cerca de tu meta.",
      "¡Imparable! Descansa bien, te lo has ganado."
    ];
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 animate-in zoom-in duration-300">
        <div className="p-6 bg-emerald-500/20 rounded-full text-emerald-400">
          <Trophy className="w-20 h-20" />
        </div>
        <h2 className="text-3xl font-bold text-white">¡Entrenamiento Completado!</h2>
        <p className="text-slate-400 text-center max-w-md italic">"{randomQuote}"</p>
        <button onClick={() => onComplete({ duration: seconds, results: sessionResults })} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-emerald-900/20">
          Guardar y Finalizar
        </button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        <button onClick={onExit} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" /> Volver
        </button>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-white">Rutina de Hoy</h1>
          <p className="text-slate-400">{ACTIVE_ROUTINE.length} Ejercicios • Hipertrofia</p>
        </div>
        
        <div className="space-y-3">
          {ACTIVE_ROUTINE.map((ex, idx) => (
            <div key={ex.id} className="flex items-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-sm">
                {idx + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white">{ex.name}</h3>
                <p className="text-xs text-slate-500">{ex.sets} series x {ex.reps} reps</p>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => setStarted(true)}
          className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xl shadow-lg shadow-emerald-900/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
        >
          <PlayCircle className="w-8 h-8" />
          COMENZAR RUTINA
        </button>
      </div>
    );
  }

  const exercise = ACTIVE_ROUTINE[currentExerciseIndex];

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      
      {/* MODAL DE FEEDBACK (Overlay) */}
      {feedbackMode && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800 space-y-6 shadow-2xl">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white">Registro de Serie</h3>
              <p className="text-slate-400 text-sm">¿Cómo te fue en {exercise.name}?</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Input Repeticiones */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Repeticiones</label>
                <div className="flex items-center gap-3 justify-center bg-slate-800/50 p-2 rounded-xl">
                  <button onClick={() => setInputReps(r => Math.max(0, r - 1))} className="p-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700 border border-slate-700"><ChevronDown className="w-4 h-4" /></button>
                  <span className="text-3xl font-bold text-white w-12 text-center">{inputReps}</span>
                  <button onClick={() => setInputReps(r => r + 1)} className="p-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700 border border-slate-700"><ChevronUp className="w-4 h-4" /></button>
                </div>
                <p className="text-xs text-center text-slate-500">Meta: {exercise.reps}</p>
              </div>

              {/* Input Peso */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Peso (kg)</label>
                <div className="flex items-center gap-3 justify-center bg-slate-800/50 p-2 rounded-xl">
                  <button onClick={() => setInputWeight(w => Math.max(0, w - 2.5))} className="p-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700 border border-slate-700"><ChevronDown className="w-4 h-4" /></button>
                  <span className="text-3xl font-bold text-emerald-400 w-16 text-center">{inputWeight}</span>
                  <button onClick={() => setInputWeight(w => w + 2.5)} className="p-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700 border border-slate-700"><ChevronUp className="w-4 h-4" /></button>
                </div>
                <p className="text-xs text-center text-slate-500">Meta: {exercise.weight}kg</p>
              </div>
            </div>

            <button onClick={confirmResultAndNext} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20">
              <CheckCircle2 className="w-5 h-5" /> Confirmar y Continuar
            </button>
          </Card>
        </div>
      )}

      {/* Header Player */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 rounded-full border border-slate-800">
          <Clock className="w-4 h-4 text-emerald-500" />
          <span className="font-mono text-xl font-bold text-white">{formatTime(seconds)}</span>
        </div>
        <button onClick={onExit} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Video/GIF Area */}
        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
          <img 
            src={exercise.gif} 
            alt={exercise.name} 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
            <h2 className="text-2xl font-bold text-white">{exercise.name}</h2>
            <p className="text-slate-300 text-sm mt-1">{exercise.notes}</p>
          </div>
          <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/10">
            Ejercicio {currentExerciseIndex + 1} / {ACTIVE_ROUTINE.length}
          </div>
        </div>

        {/* Controls & Info */}
        <Card className="flex-1 flex flex-col justify-between bg-slate-900/80 border-slate-800">
          <div className="grid grid-cols-3 gap-4 text-center mb-6">
            <div className="p-3 bg-slate-800 rounded-xl">
              <p className="text-xs text-slate-500 uppercase font-bold">Series</p>
              <p className="text-2xl font-bold text-white">{exercise.sets}</p>
            </div>
            <div className="p-3 bg-slate-800 rounded-xl">
              <p className="text-xs text-slate-500 uppercase font-bold">Reps</p>
              <p className="text-2xl font-bold text-white">{exercise.reps}</p>
            </div>
            <div className="p-3 bg-slate-800 rounded-xl">
              <p className="text-xs text-slate-500 uppercase font-bold">Peso</p>
              <p className="text-2xl font-bold text-emerald-400">{exercise.weight} <span className="text-xs">kg</span></p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsPaused(!isPaused)}
              className={`p-4 rounded-xl flex-1 font-bold flex items-center justify-center gap-2 transition-colors ${
                isPaused ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {isPaused ? <PlayCircle className="w-6 h-6" /> : <PauseCircle className="w-6 h-6" />}
              {isPaused ? 'REANUDAR' : 'PAUSAR'}
            </button>
            
            <button 
              onClick={handleNext}
              className="p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex-[2] font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/20"
            >
              {currentExerciseIndex === ACTIVE_ROUTINE.length - 1 ? 'FINALIZAR' : 'TERMINAR SERIE'}
              <SkipForward className="w-6 h-6" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export const ClientDashboard = () => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'weekly' | 'workout'>('dashboard');
  const [weeklyPlan, setWeeklyPlan] = useState(INITIAL_WEEKLY_PLAN);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  
  // Estado para el modal de repetir rutina
  const [redoModalOpen, setRedoModalOpen] = useState(false);

  // Mock Data para visualización
  const currentWeek = "Semana 4: Hipertrofia";
  const nextWeek = "Semana 5: Descarga";
  
  const handleDayClick = (day: any) => {
    if (day.type === 'rest') return; // No hacer nada en días de descanso por ahora

    setSelectedDayId(day.id);

    if (day.isCompleted) {
      setRedoModalOpen(true);
    } else {
      setViewMode('workout');
    }
  };

  const handleRedoOption = (option: 'overwrite' | 'new') => {
    setRedoModalOpen(false);
    if (option === 'overwrite') {
      // Lógica para limpiar datos anteriores si fuera necesario
      console.log("Sobreescribiendo datos del día:", selectedDayId);
    } else {
      console.log("Creando nuevo registro para el día:", selectedDayId);
    }
    setViewMode('workout');
  };

  const handleWorkoutComplete = (data: any) => {
    // 1. Actualizar estado local para marcar como completado
    setWeeklyPlan(prev => prev.map(d => d.id === selectedDayId ? { ...d, isCompleted: true } : d));
    
    // 2. Simular envío de datos al entrenador
    console.log("🚀 ENVIANDO DATOS AL ENTRENADOR:", {
      dayId: selectedDayId,
      week: currentWeek,
      duration: data.duration,
      exercises: data.results,
      timestamp: new Date().toISOString()
    });

    // 3. Volver a la vista semanal
    setViewMode('weekly');
  };

  if (viewMode === 'workout') {
    return <WorkoutSession onExit={() => setViewMode('weekly')} onComplete={handleWorkoutComplete} />;
  }

  if (viewMode === 'weekly') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        {/* Modal de Repetición */}
        {redoModalOpen && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
            <Card className="w-full max-w-md bg-slate-900 border-slate-800 space-y-6 shadow-2xl p-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 bg-yellow-500/10 rounded-full text-yellow-500">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Rutina ya completada</h3>
                  <p className="text-slate-400 text-sm mt-2">Ya has registrado datos para este día. ¿Qué deseas hacer?</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <button onClick={() => handleRedoOption('overwrite')} className="flex items-center justify-center gap-3 p-4 bg-slate-800 hover:bg-red-900/20 hover:border-red-500/50 border border-slate-700 rounded-xl transition-all group">
                  <RefreshCw className="w-5 h-5 text-slate-400 group-hover:text-red-400" />
                  <div className="text-left">
                    <p className="font-bold text-white group-hover:text-red-400">Repetir y Sobreescribir</p>
                    <p className="text-xs text-slate-500">Borrará los datos anteriores de hoy.</p>
                  </div>
                </button>
                <button onClick={() => handleRedoOption('new')} className="flex items-center justify-center gap-3 p-4 bg-slate-800 hover:bg-emerald-900/20 hover:border-emerald-500/50 border border-slate-700 rounded-xl transition-all group">
                  <PlusCircle className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
                  <div className="text-left">
                    <p className="font-bold text-white group-hover:text-emerald-400">Crear Nuevo Registro</p>
                    <p className="text-xs text-slate-500">Guardar como una sesión adicional.</p>
                  </div>
                </button>
              </div>
              <button onClick={() => setRedoModalOpen(false)} className="w-full py-3 text-slate-400 hover:text-white text-sm font-medium">Cancelar</button>
            </Card>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button onClick={() => setViewMode('dashboard')} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Plan Semanal</h1>
            <p className="text-slate-400 text-sm">{currentWeek}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {weeklyPlan.map((day) => (
            <div 
              key={day.id}
              onClick={() => handleDayClick(day)}
              className={`p-4 rounded-xl border transition-all flex items-center justify-between group ${
                day.type === 'rest' 
                  ? 'bg-slate-900/30 border-slate-800 opacity-70 cursor-default' 
                  : day.isCompleted 
                    ? 'bg-emerald-900/10 border-emerald-500/30 cursor-pointer hover:bg-emerald-900/20' 
                    : 'bg-slate-900 border-slate-800 cursor-pointer hover:border-blue-500/50 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  day.isCompleted ? 'bg-emerald-500 text-black' : day.type === 'rest' ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 text-white'
                }`}>
                  {day.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : day.day.substring(0, 2)}
                </div>
                <div>
                  <h3 className={`font-bold ${day.isCompleted ? 'text-emerald-400' : 'text-white'}`}>{day.day}</h3>
                  <p className="text-sm text-slate-400">{day.title}</p>
                </div>
              </div>
              
              {day.type !== 'rest' && (
                <div className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800">
                  {day.isCompleted ? (
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1"><Trophy className="w-3 h-3" /> Completado</span>
                  ) : (
                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1"><Play className="w-3 h-3" /> Iniciar</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Bienvenida */}
      <div>
        <h1 className="text-3xl font-bold text-white">Hola, Atleta</h1>
        <p className="text-slate-400">Aquí tienes tu resumen semanal y planificación.</p>
      </div>

      {/* Grid Principal de 4 Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* MÓDULO 1: RUTINA ACTUAL */}
        <Card onClick={() => setViewMode('weekly')} className="relative overflow-hidden group cursor-pointer hover:border-emerald-500/50 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Dumbbell className="w-24 h-24 text-emerald-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                <Calendar className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Rutina Esta Semana</h2>
            </div>
            <p className="text-slate-300 mb-6">{currentWeek}</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm p-2 bg-slate-800/50 rounded-lg">
                <span className="text-slate-400">Lunes</span>
                <span className="text-white font-medium">Pierna Pesada</span>
              </div>
              <div className="flex justify-between text-sm p-2 bg-slate-800/50 rounded-lg">
                <span className="text-slate-400">Martes</span>
                <span className="text-white font-medium">Empuje (Push)</span>
              </div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setViewMode('weekly'); }} className="mt-6 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
              Ver Rutina Completa <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </Card>

        {/* MÓDULO 2: PRÓXIMA SEMANA */}
        <Card className="relative overflow-hidden group cursor-pointer hover:border-blue-500/50 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar className="w-24 h-24 text-blue-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Próxima Semana</h2>
            </div>
            <p className="text-slate-300 mb-6">{nextWeek}</p>
            <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-blue-200">
                <span className="font-bold">Objetivo:</span> Reducción de volumen para recuperación del SNC. Mantener intensidad alta pero menos series.
              </p>
            </div>
            <button className="mt-6 w-full py-2 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
              Previsualizar Plan <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </Card>

        {/* MÓDULO 3: ESTADÍSTICAS Y PROGRESO */}
        <Card className="relative overflow-hidden group cursor-pointer hover:border-purple-500/50 transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
              <BarChart className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Tus Estadísticas</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-slate-800/50 rounded-xl text-center">
              <p className="text-xs text-slate-500 uppercase font-bold">Peso Corporal</p>
              <p className="text-2xl font-bold text-white mt-1">75.4 <span className="text-xs text-emerald-400">kg</span></p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl text-center">
              <p className="text-xs text-slate-500 uppercase font-bold">Cumplimiento</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">92%</p>
            </div>
          </div>
          <div className="p-3 bg-purple-900/10 border border-purple-500/20 rounded-lg">
            <p className="text-xs text-purple-300 flex items-center gap-2">
              <Star className="w-3 h-3" /> ¡Has aumentado tu RM en Sentadilla un 5%!
            </p>
          </div>
        </Card>

        {/* MÓDULO 4: SUGERENCIAS Y TUTORIALES */}
        <Card className="relative overflow-hidden group cursor-pointer hover:border-yellow-500/50 transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Feedback y Tutoriales</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-800 rounded-xl border-l-4 border-yellow-500">
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Mensaje del Coach</p>
              <p className="text-sm text-slate-300 italic">"Excelente trabajo con la profundidad en sentadilla. Para la próxima semana enfócate más en la fase excéntrica del press banca."</p>
            </div>
            
            <button className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group/btn">
              <div className="flex items-center gap-3">
                <Play className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-white">Tutorial: Técnica de Peso Muerto</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover/btn:text-white" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};