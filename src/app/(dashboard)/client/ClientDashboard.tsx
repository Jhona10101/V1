import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Calendar, TrendingUp, MessageCircle, Play, ChevronRight, ChevronLeft, Dumbbell, ArrowLeft, Clock, PlayCircle, PauseCircle, SkipForward, CheckCircle2, X, ChevronDown, ChevronUp, Trophy, AlertTriangle, RefreshCw, PlusCircle, Zap, Hourglass, History, Eye, Activity, Search, Youtube } from 'lucide-react';
import { useUserStore } from '@/store/user.store';
import { doc, onSnapshot, setDoc, collection, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Utilities for week calculations (Monday as week start)
const getWeekStart = (d: Date) => {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  date.setHours(0,0,0,0);
  return date;
};
const getWeekEnd = (start: Date) => {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23,59,59,999);
  return end;
};
const getWeekStartISO = (d: Date) => {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Monday = 0
  date.setDate(date.getDate() - day);
  date.setHours(0,0,0,0);
  return date.toISOString().slice(0,10);
};



// Plan Semanal Inicial
const INITIAL_WEEKLY_PLAN = [
  { id: 'mon', day: 'Lunes', title: 'Pierna Enfocada', type: 'training', isCompleted: false, exercises: [] },
  { id: 'tue', day: 'Martes', title: 'Empuje (Push)', type: 'training', isCompleted: false, exercises: [] },
  { id: 'wed', day: 'Miércoles', title: 'Descanso Activo', type: 'rest', isCompleted: false, exercises: [] },
  { id: 'thu', day: 'Jueves', title: 'Tracción (Pull)', type: 'training', isCompleted: false, exercises: [] },
  { id: 'fri', day: 'Viernes', title: 'Full Body', type: 'training', isCompleted: false, exercises: [] },
  { id: 'sat', day: 'Sábado', title: 'Cardio LISS', type: 'cardio', isCompleted: false, exercises: [] },
  { id: 'sun', day: 'Domingo', title: 'Descanso Total', type: 'rest', isCompleted: false, exercises: [] },
];

const WorkoutSession = ({ onExit, onComplete, exercises }: { onExit: () => void; onComplete: (results: any) => void; exercises?: any[] }) => {
  const [started, setStarted] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1); // Nueva lógica: Control de Series
  const [isResting, setIsResting] = useState(false); // Nueva lógica: Estado de Descanso
  const [restTimer, setRestTimer] = useState(0); // Temporizador de descanso

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

  // Lógica del Temporizador de Descanso
  useEffect(() => {
    let interval: any;
    if (isResting && restTimer > 0) {
      interval = setInterval(() => setRestTimer(t => t - 1), 1000);
    } else if (isResting && restTimer === 0) {
      setIsResting(false); // Termina el descanso automáticamente
    }
    return () => clearInterval(interval);
  }, [isResting, restTimer]);

  // Inicializar inputs con los valores planificados al cambiar de ejercicio
  useEffect(() => {
    const ex = (exercises && exercises.length) ? exercises[currentExerciseIndex] : undefined;
    if (ex) {
      setInputReps(ex.reps);
      setInputWeight(ex.weight);
    }
  }, [currentExerciseIndex, exercises]);

  // Use the passed exercises; do NOT fall back to a global mock when none provided.
  // If exercises are empty, UI will show a friendly message instead of fake data.
  const routine = (exercises && exercises.length) ? exercises : [];
  const exercise = routine[currentExerciseIndex];

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
      exerciseId: exercise.id,
      setNumber: currentSet,
      planned: { reps: exercise.reps, weight: exercise.weight },
      actual: { reps: inputReps, weight: inputWeight }
    };
    setSessionResults([...sessionResults, result]);
    setFeedbackMode(false);

    // Lógica de Series y Descanso
    if (currentSet < (exercise?.sets || 0)) {
      // Si faltan series, iniciamos descanso (MACRO) y aumentamos serie
      setRestTimer(Math.round((exercise.macroPause || 0) * 60));
      setIsResting(true);
      setCurrentSet(prev => prev + 1);
    } else {
      // Si terminamos todas las series del ejercicio
      if (currentExerciseIndex < routine.length - 1) {
        // Pasamos al siguiente ejercicio (con descanso MICRO previo)
        setRestTimer(Math.round((exercise?.microPause || 0) * 60));
        setIsResting(true);
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSet(1);
      } else {
        setFinished(true);
      }
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

  // VISTA DE DESCANSO
  if (isResting) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-8 animate-in fade-in duration-300">
        <h2 className="text-4xl font-bold text-white">Descanso</h2>
        <div className="relative w-64 h-64 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-8 border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-8 border-emerald-500 border-t-transparent animate-spin duration-[3000ms]"></div>
          <span className="text-6xl font-mono font-bold text-emerald-400">{formatTime(restTimer)}</span>
        </div>
  <p className="text-slate-400">Próxima Serie: {currentSet} de {routine[currentExerciseIndex]?.sets ?? 0}</p>
        <button onClick={() => { setIsResting(false); setRestTimer(0); }} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors">Omitir Descanso</button>
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
          <p className="text-slate-400">{routine.length} Ejercicios • Hipertrofia</p>
        </div>
        
        <div className="space-y-3">
          {routine.length === 0 && (
            <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-xl text-slate-400">No hay ejercicios planificados para este día. Contacta a tu entrenador si crees que falta algo.</div>
          )}
          {routine.map((ex, idx) => (
            <div key={ex.id ?? idx} className="flex items-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-sm">
                {idx + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white">{ex.name}</h3>
                <div className="flex gap-3 text-xs text-slate-500 mt-1">
                  <span>{ex.sets} Series</span>
                  <span>{ex.reps} Reps</span>
                  <span className="text-emerald-500">{ex.speed} Velocidad</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={() => routine.length && setStarted(true)}
          className={`w-full py-6 ${routine.length ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer' : 'bg-slate-800 text-slate-500 cursor-not-allowed'} rounded-2xl font-bold text-xl shadow-lg shadow-emerald-900/20 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3`}
        >
          <PlayCircle className="w-8 h-8" />
          {routine.length ? 'COMENZAR RUTINA' : 'NO HAY RUTINA'}
        </button>
      </div>
    );
  }

  // routine/exercise already defined earlier

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      
      {/* MODAL DE FEEDBACK (Overlay) */}
      {feedbackMode && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800 space-y-6 shadow-2xl">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white">Registro de Serie</h3>
              <p className="text-slate-400 text-sm">Serie {currentSet} de {exercise.sets} - {exercise.name}</p>
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
            src={exercise.gifUrl} 
            alt={exercise.name} 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
            <h2 className="text-2xl font-bold text-white">{exercise.name}</h2>
            <p className="text-slate-300 text-sm mt-1">{exercise.notes}</p>
          </div>
          <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-bold text-white border border-white/10">
            Serie {currentSet} / {exercise.sets}
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

          <div className="grid grid-cols-3 gap-2 px-4 py-2 bg-slate-950/50 rounded-lg mb-6 border border-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Zap className="w-4 h-4 text-yellow-500" /> Velocidad: <span className="text-white font-mono">{exercise.speed}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Hourglass className="w-4 h-4 text-blue-500" /> Desc. Series: <span className="text-white font-mono">{Math.round((exercise.macroPause || 0) * 60)}s</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Hourglass className="w-4 h-4 text-purple-500" /> Desc. Ejer.: <span className="text-white font-mono">{Math.round((exercise.microPause || 0) * 60)}s</span>
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
              TERMINAR SERIE
              <SkipForward className="w-6 h-6" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- COMPONENTE DE TUTORIALES Y FEEDBACK ---
const ClientTutorials = ({ onBack, weeklyPlan }: { onBack: () => void, weeklyPlan: any[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allExercises, setAllExercises] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<{url: string, title: string} | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = 340;
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  // Cargar todos los ejercicios para el buscador global
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const snap = await getDocs(collection(db, 'exercises'));
        setAllExercises(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Error fetching exercises", e);
      }
    };
    fetchExercises();
  }, []);

  // Extraer ejercicios únicos de la semana actual
  const weeklyExercises = weeklyPlan.flatMap(d => d.exercises || []).reduce((acc: any[], current: any) => {
    // Enriquecer con datos de la biblioteca para asegurar videoUrl si falta en el plan
    const libraryEx = allExercises.find(e => e.id === current.exerciseId || e.id === current.id || e.title === current.name || e.name === current.name);
    const finalEx = libraryEx ? { ...libraryEx, ...current } : current;

    const x = acc.find(item => item.name === finalEx.name);
    if (!x) {
      return acc.concat([finalEx]);
    } else {
      return acc;
    }
  }, []);

  // Filtrar ejercicios globales
  const filteredGlobal = allExercises.filter(e => e.title?.toLowerCase().includes(searchTerm.toLowerCase()));
  
  // Categorías únicas
  const categories = Array.from(new Set(allExercises.map(e => e.muscleGroup).filter(Boolean))).sort();

  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        <div><h1 className="text-2xl font-bold text-white">Tutoriales y Técnica</h1><p className="text-slate-400 text-sm">Perfecciona tus movimientos.</p></div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input 
          type="text" 
          placeholder="Buscar ejercicio en la biblioteca..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
        />
      </div>

      {/* Sección: Ejercicios de esta semana */}
      {!searchTerm && !selectedCategory && (
        <div className="space-y-3 relative group/carousel">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Tu Semana Actual</h2>
            <div className="flex gap-2">
              <button onClick={() => scroll('left')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors border border-slate-700"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => scroll('right')} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors border border-slate-700"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
          <div ref={scrollContainerRef} className="flex gap-4 overflow-x-auto pb-4 snap-x scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {weeklyExercises.length === 0 && <div className="text-slate-500 text-sm italic p-2">No hay ejercicios asignados esta semana.</div>}
            {weeklyExercises.map((ex: any, i: number) => (
              <div key={i} onClick={() => setSelectedVideo({ url: ex.videoUrl || '', title: ex.name })} className={`snap-center flex-shrink-0 w-80 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden group cursor-pointer hover:border-yellow-500/50 transition-all`}>
                <div className="aspect-video bg-black relative">
                  {ex.gifUrl ? <img src={ex.gifUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" /> : <div className="w-full h-full flex items-center justify-center bg-slate-800"><Dumbbell className="w-8 h-8 text-slate-600" /></div>}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/90 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 text-black fill-black" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-white text-sm truncate">{ex.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">{ex.videoUrl ? <span className="text-emerald-400">Video Disponible</span> : 'Sin video'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categorías de Grupos Musculares */}
      {!searchTerm && !selectedCategory && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Dumbbell className="w-5 h-5 text-blue-500" /> Explorar por Músculo</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat: any) => {
              const groupExercises = allExercises.filter(e => e.muscleGroup === cat);
              const coverImage = groupExercises.find(e => e.gifUrl)?.gifUrl;
              return (
                <div key={cat} onClick={() => setSelectedCategory(cat)} className="relative h-32 rounded-xl overflow-hidden cursor-pointer group border border-slate-800 hover:border-yellow-500 transition-all">
                  {coverImage ? <img src={coverImage} alt={cat} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-500" /> : <div className="absolute inset-0 bg-slate-800" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <h3 className="font-bold text-white capitalize text-lg">{cat}</h3>
                    <p className="text-xs text-slate-400">{groupExercises.length} ejercicios</p>
                  </div>
                </div>
              );
            })}
            {categories.length === 0 && <div className="col-span-full text-slate-500 text-sm italic">Cargando categorías...</div>}
          </div>
        </div>
      )}

      {/* Resultados de Búsqueda / Biblioteca */}
      {(searchTerm || selectedCategory) && (
      <div className="space-y-3 animate-in fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-500" /> 
            {searchTerm ? 'Resultados' : `Ejercicios de ${selectedCategory}`}
          </h2>
          {selectedCategory && !searchTerm && (
            <button onClick={() => setSelectedCategory(null)} className="text-xs text-slate-400 hover:text-white underline">Ver todas las categorías</button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(searchTerm ? filteredGlobal : allExercises.filter(e => e.muscleGroup === selectedCategory)).map((ex) => (
             <div key={ex.id} onClick={() => setSelectedVideo({ url: ex.videoUrl || '', title: ex.title || ex.name })} className="flex items-center gap-3 p-3 bg-slate-900/50 border border-slate-800 rounded-xl hover:bg-slate-800 cursor-pointer group">
                <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {ex.gifUrl ? <img src={ex.gifUrl} className="w-full h-full object-cover" /> : <Dumbbell className="w-5 h-5 text-slate-500" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white text-sm">{ex.title || ex.name}</h3>
                  <p className="text-xs text-slate-500">{ex.muscleGroup}</p>
                </div>
                {ex.videoUrl && <PlayCircle className="w-6 h-6 text-slate-600 group-hover:text-yellow-500 transition-colors" />}
             </div>
          ))}
          {searchTerm && filteredGlobal.length === 0 && <div className="text-slate-500 text-sm">No se encontraron ejercicios.</div>}
        </div>
      </div>
      )}

      {/* Modal de Video */}
      {selectedVideo && (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-4xl bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <div className="p-4 flex justify-between items-center border-b border-slate-800">
              <h3 className="font-bold text-white flex items-center gap-2"><Youtube className="w-5 h-5 text-red-500" /> {selectedVideo.title}</h3>
              <button onClick={() => setSelectedVideo(null)} className="p-1 hover:bg-slate-800 rounded-full text-slate-400"><X className="w-6 h-6" /></button>
            </div>
            <div className="aspect-video w-full bg-black">
              {getEmbedUrl(selectedVideo.url) ? (
                <iframe 
                  src={getEmbedUrl(selectedVideo.url)!} 
                  title={selectedVideo.title}
                  className="w-full h-full" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                  <AlertTriangle className="w-10 h-10" />
                  <p>URL de video no válida o no disponible.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTES ESTADÍSTICOS ANIMADOS ---
const AnimatedCircularProgress = ({ value, size = 70, color = "#10b981" }: { value: number, size?: number, color?: string }) => {
  const [percent, setPercent] = useState(0);
  useEffect(() => { setTimeout(() => setPercent(value), 300); }, [value]);
  
  const radius = (size - 8) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle cx="50%" cy="50%" r={radius} stroke="#1e293b" strokeWidth="6" fill="transparent" />
        <circle cx="50%" cy="50%" r={radius} stroke={color} strokeWidth="6" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className="text-sm font-bold text-white">{Math.round(percent)}%</span>
      </div>
    </div>
  );
};

const AnimatedGroupedBarChart = ({ planned, actual, labels }: { planned: number[], actual: number[], labels: string[] }) => {
  const max = Math.max(...planned, ...actual, 100);
  return (
    <div className="flex items-end gap-2 h-28 w-full mt-4 px-1">
      {planned.map((pVal, i) => {
        const aVal = actual[i];
        const isDone = aVal > 0;
        const isTargetMet = aVal >= pVal;
        
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
            <div className="flex items-end gap-0.5 w-full justify-center h-full">
               {/* Planned Bar (Gray/Ghost) */}
               <div style={{ height: `${(pVal / max) * 100}%` }} className="w-1/2 bg-slate-700/30 rounded-t-sm transition-all duration-1000 relative">
               </div>
               {/* Actual Bar (Colored) */}
               <div style={{ height: `${(aVal / max) * 100}%` }} className={`w-1/2 ${isTargetMet ? 'bg-emerald-500' : 'bg-blue-500'} rounded-t-sm transition-all duration-1000 relative`}>
                  {isDone && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
               </div>
            </div>
            <span className="text-[9px] text-slate-500 uppercase font-bold">{labels[i]}</span>
        </div>
        );
      })}
    </div>
  );
};

// Componente de Historial del Cliente (Basado en Feedback del Coach)
const ClientHistory = ({ onBack }: { onBack: () => void }) => {
  const userStore = useUserStore();
  const uid = userStore.user?.uid;
  const [routines, setRoutines] = useState<any[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [gifModal, setGifModal] = useState<{isOpen: boolean, url: string, title: string} | null>(null);

  // Calendar state
  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const currentYear = new Date().getFullYear();
  const YEARS_START = 2025;
  const yearOptions = Array.from({ length: Math.max(1, currentYear - YEARS_START + 3) }, (_, i) => YEARS_START + i);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [computedWeeks, setComputedWeeks] = useState<any[]>([]);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);

  // Compute weeks
  useEffect(() => {
    const firstOfMonth = new Date(selectedYear, selectedMonth, 1);
    const lastOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
    
    const getWeekStartDate = (d: Date) => {
      const date = new Date(d);
      const day = (date.getDay() + 6) % 7; // Monday=0
      date.setDate(date.getDate() - day);
      date.setHours(0,0,0,0);
      return date;
    };

    const weeks: any[] = [];
    let cursor = getWeekStartDate(firstOfMonth);
    const lastCursor = getWeekStartDate(lastOfMonth);
    let idx = 1;
    
    while (cursor <= lastCursor) {
      const start = new Date(cursor);
      const end = new Date(cursor);
      end.setDate(end.getDate() + 6);
      const wkStartISO = start.toISOString().slice(0,10);
      const wkEndISO = end.toISOString().slice(0,10);
      const title = `Semana ${idx}`;
      const rangeLabel = `${start.toLocaleDateString()} al ${end.toLocaleDateString()}`;
      weeks.push({ weekStartISO: wkStartISO, weekEndISO: wkEndISO, title, rangeLabel });
      cursor.setDate(cursor.getDate() + 7);
      idx += 1;
    }
    setComputedWeeks(weeks);
    
    if (weeks.length > 0 && !weeks.find(w => w.weekStartISO === selectedWeekStart)) {
      const currentISO = getWeekStartISO(new Date());
      const found = weeks.find(w => w.weekStartISO === currentISO);
      if (found) {
        setSelectedWeekStart(found.weekStartISO);
        setSelectedRoutineId(found.weekStartISO);
      } else {
        setSelectedWeekStart(weeks[0].weekStartISO);
        setSelectedRoutineId(weeks[0].weekStartISO);
      }
    }
  }, [selectedYear, selectedMonth]);

  // Fetch routines & sessions
  useEffect(() => {
    if (!uid) return;
    const colRef = collection(db, 'users', uid, 'routines');
    const unsub = onSnapshot(colRef, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, data: d.data() }));
      setRoutines(items);
    });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid || !selectedRoutineId) return;
    const found = routines.find(r => r.id === selectedRoutineId);
    setSelectedRoutine(found?.data ?? null);

    const anchor = found?.data?.weekStart ? new Date(found.data.weekStart + 'T00:00:00') : new Date();
    const weekStart = getWeekStart(anchor);
    const weekEnd = getWeekEnd(weekStart);

    const sessionsCol = collection(db, 'users', uid, 'trainingSessions');
    const q = query(sessionsCol, where('createdAt', '>=', weekStart), where('createdAt', '<=', weekEnd));
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, data: d.data() })));
    });
    return () => unsub();
  }, [selectedRoutineId, routines, uid]);

  const toggleDay = (idx: number) => setExpandedDay(expandedDay === idx ? null : idx);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
       <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          <div><h1 className="text-2xl font-bold text-white">Historial de Entrenamiento</h1><p className="text-slate-400 text-sm">Revisa tus rutinas pasadas.</p></div>
       </div>

       <Card className="bg-slate-900/50 border-slate-800 w-full"><div className="w-full p-4"><div className="flex items-center gap-3 w-full">
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-slate-950 border border-slate-800 rounded-md p-2 text-sm text-slate-200">{yearOptions.map(y => <option key={y} value={y}>{y}</option>)}</select>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-950 border border-slate-800 rounded-md p-2 text-sm text-slate-200">{MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}</select>
          <div className="flex-1 flex items-center gap-3 overflow-x-auto py-2">{computedWeeks.map((w) => {
             const isSelected = w.weekStartISO === selectedWeekStart;
             return (<button key={w.weekStartISO} onClick={() => { setSelectedWeekStart(w.weekStartISO); setSelectedRoutineId(w.weekStartISO); }} className={`px-4 py-3 rounded-lg text-left min-w-[170px] flex-shrink-0 transition-all ${isSelected ? 'ring-2 ring-emerald-400 bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}><div className="font-bold text-sm">{w.title}</div><div className={`text-xs mt-1 ${isSelected ? 'text-emerald-100' : 'text-slate-300'}`}>{w.rangeLabel}</div></button>);
          })}</div>
       </div></div></Card>

       <div className="space-y-4">
         {!selectedRoutine && <Card className="p-4 text-slate-400">Selecciona una semana.</Card>}
         {selectedRoutine?.days?.map((day: any, idx: number) => {
            const isRest = day.isRest;
            const hasExercises = day.exercises && day.exercises.length > 0;
            const isDayCompleted = hasExercises && day.exercises.every((e: any) => sessions.some(s => (s.data?.exercises || []).some((ae: any) => ae.exerciseId === e.id)));
            
            let cardStyle = 'bg-slate-900/30 border-slate-800';
            let iconContent = <span className="font-bold text-xs">{day.dayName?.substring(0,2) || 'D'}</span>;
            let iconStyle = 'bg-slate-800 text-slate-500 border-slate-700';
            let titleColor = 'text-white';
            let statusBadge = null;

            if (isRest) { cardStyle = 'bg-slate-800/40 border-slate-700 opacity-75'; iconContent = <Calendar className="w-5 h-5" />; titleColor = 'text-slate-400'; statusBadge = <span className="px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descanso</span>; }
            else if (isDayCompleted) { cardStyle = 'bg-emerald-950/10 border-emerald-500/30 shadow-lg shadow-emerald-900/10'; iconStyle = 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]'; iconContent = <CheckCircle2 className="w-6 h-6" />; titleColor = 'text-emerald-400'; statusBadge = <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1"><Zap className="w-3 h-3" /> Completado</span>; }
            else if (hasExercises) { cardStyle = 'bg-blue-900/10 border-blue-500/30'; iconStyle = 'bg-blue-600 text-white border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]'; iconContent = <Clock className="w-5 h-5" />; titleColor = 'text-blue-400'; statusBadge = <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-[10px] font-bold text-blue-400 uppercase tracking-wider">Pendiente</span>; }

            return (
              <div key={idx} className={`border rounded-xl overflow-hidden transition-all duration-300 ${cardStyle}`}>
                <button onClick={() => toggleDay(idx)} className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${iconStyle}`}>{iconContent}</div><div><div className="flex items-center gap-2"><div className={`font-bold text-lg ${titleColor}`}>{day.dayName || day.name || day.day}</div>{statusBadge}</div><div className="text-sm text-slate-400 text-left">{day.focus}</div></div></div>
                  {expandedDay === idx ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                </button>
                {expandedDay === idx && hasExercises && (
                  <div className="p-4 border-t border-slate-800 bg-slate-950/30"><div className="space-y-2">
                      {day.exercises.map((ex: any) => (
                        <div key={ex.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800">
                          <div><div className="font-medium text-white">{ex.name}</div><div className="text-sm text-slate-400 mt-1"><span className="text-emerald-400 font-bold">{ex.sets}</span> series x <span className="text-emerald-400 font-bold">{ex.reps}</span> reps @ <span className="text-emerald-400 font-bold">{ex.weight}</span> kg</div></div>
                          <button onClick={() => setGifModal({ isOpen: true, url: ex.gifUrl, title: ex.name })} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 rounded-lg text-xs font-bold transition-colors border border-slate-700"><Eye className="w-4 h-4" /> Ver Ejercicio</button>
                        </div>
                      ))}
                  </div></div>
                )}
              </div>
            );
         })}
       </div>

       {gifModal?.isOpen && (
         <div className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 p-0 overflow-hidden shadow-2xl">
             <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900"><h3 className="font-bold text-white">{gifModal.title}</h3><button onClick={() => setGifModal(null)} className="p-1 hover:bg-slate-800 rounded-full text-slate-400"><X className="w-5 h-5" /></button></div>
             <div className="aspect-video bg-black flex items-center justify-center">{gifModal.url ? <img src={gifModal.url} alt={gifModal.title} className="w-full h-full object-contain" /> : <div className="text-slate-500 flex flex-col items-center gap-2"><AlertTriangle className="w-10 h-10" /><p>No hay demostración disponible</p></div>}</div>
           </Card>
         </div>
       )}
    </div>
  );
};

export const ClientDashboard = () => {
  // Open client directly in weekly plan so they immediately see the coach's program for the current week
  const [viewMode, setViewMode] = useState<'dashboard' | 'weekly' | 'workout' | 'history' | 'tutorials'>('dashboard');
  const [weeklyPlan, setWeeklyPlan] = useState(INITIAL_WEEKLY_PLAN);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [activeRoutineExercises, setActiveRoutineExercises] = useState<any[]>([]);
  const [currentRoutineDoc, setCurrentRoutineDoc] = useState<any | null>(null);
  // nextRoutineDoc removed: we only track current week's routine for the client view
  const [currentWeekId, setCurrentWeekId] = useState(getWeekStartISO(new Date()));
  const [weekSessions, setWeekSessions] = useState<any[]>([]);
  const userStore = useUserStore();

  // Escuchar rutinas guardadas (current / next) para el usuario y actualizar el weeklyPlan
  useEffect(() => {
    const uid = userStore.user?.uid;
    if (!uid) return;

    // 1. Determinar la semana actual (Lunes)
    const thisWeekISO = getWeekStartISO(new Date());
    setCurrentWeekId(thisWeekISO);

    // 2. Referencias a documentos por ID de fecha (ISO)
    const curRef = doc(db, 'users', uid, 'routines', thisWeekISO);
    

    const unsubCur = onSnapshot(curRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCurrentRoutineDoc(data);
        // Mapear days a weeklyPlan
        if (Array.isArray(data.days)) {
          const mapped = data.days.map((d: any) => ({ 
            id: d.id, 
            day: d.dayName, 
            title: d.focus, 
            // Si es descanso O no tiene ejercicios, lo tratamos como descanso visualmente
            type: (d.isRest || !d.exercises || d.exercises.length === 0) ? 'rest' : 'training', 
            isCompleted: false, 
            exercises: d.exercises 
          }));
          setWeeklyPlan(mapped.length ? mapped : INITIAL_WEEKLY_PLAN);
        }
      } else {
        setCurrentRoutineDoc(null);
        // Si no hay rutina asignada, mostramos estructura vacía o de descanso
        setWeeklyPlan(INITIAL_WEEKLY_PLAN.map(d => ({ ...d, title: 'No asignado', type: 'rest', exercises: [] })));
      }
    }, (err) => console.error('routines current onSnapshot', err));

    return () => { unsubCur(); };
  }, [userStore.user]);

  // Sincronización en tiempo real: Si el entrenador actualiza la rutina mientras el cliente la ve
  useEffect(() => {
    if (selectedDayId && currentRoutineDoc?.days) {
      const found = currentRoutineDoc.days.find((d: any) => d.id === selectedDayId || d.dayName === selectedDayId);
      if (found) {
        setActiveRoutineExercises(found.exercises || []);
      }
    }
  }, [currentRoutineDoc, selectedDayId]);

  // When the current routine doc is set/updated, fetch training sessions for the same week and mark days completed
  useEffect(() => {
    const uid = userStore.user?.uid;
    if (!uid || !currentRoutineDoc) return;

    // Determine week anchor from routine startDate (if present) or today
    const anchor = currentRoutineDoc?.weekStart ? new Date(currentRoutineDoc.weekStart + 'T00:00:00') : new Date();
    const weekStart = getWeekStart(anchor);
    const weekEnd = getWeekEnd(weekStart);

    const sessionsCol = collection(db, 'users', uid, 'trainingSessions');
    const q = query(sessionsCol, where('createdAt', '>=', weekStart), where('createdAt', '<=', weekEnd));
    getDocs(q).then(snap => {
      const sessions = snap.docs.map(d => d.data());
      setWeekSessions(sessions);
      
      setWeeklyPlan(prev => prev.map(day => {
        // Si no tiene ejercicios, no puede estar completado (evita falsos positivos en días vacíos)
        if (!day.exercises || day.exercises.length === 0) return { ...day, isCompleted: false };

        // Filtrar sesiones para este día
        const daySessions = sessions.filter((s: any) => s.dayId === day.id);
        
        // Recopilar IDs de ejercicios realizados
        const performedIds = new Set();
        daySessions.forEach((s: any) => {
          if (Array.isArray(s.exercises)) {
            s.exercises.forEach((e: any) => performedIds.add(e.exerciseId));
          }
        });

        // Verificar que TODOS los ejercicios planificados tengan al menos un registro
        const isDone = day.exercises.every((pe: any) => performedIds.has(pe.id));
        
        return { ...day, isCompleted: isDone };
      }));
    }).catch(err => console.error('error fetching sessions for week', err));
  }, [currentRoutineDoc, userStore.user]);
  
  // Estado para el modal de repetir rutina
  const [redoModalOpen, setRedoModalOpen] = useState(false);

  // Week titles (show planned status if routines exist)
  const currentWeek = currentRoutineDoc ? `Semana del ${new Date(currentWeekId).toLocaleDateString()} · Planificado` : 'Esta Semana (Sin Plan)';
  
  const handleDayClick = (day: any) => {
    if (day.type === 'rest') return; // No hacer nada en días de descanso por ahora

    setSelectedDayId(day.id);

    // Buscar ejercicios planificados en la rutina actual (if available)
    const found = currentRoutineDoc?.days?.find((d: any) => d.id === day.id || d.dayName === day.day);
    const exercises = found?.exercises || [];
    setActiveRoutineExercises(exercises);

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
    const payload = {
      dayId: selectedDayId,
      week: currentWeek,
      duration: data.duration,
      exercises: data.results,
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    };
    console.log("🚀 ENVIANDO DATOS AL ENTRENADOR:", payload);

    // Guardar sesión en Firestore para que el entrenador pueda revisar feedback
    (async () => {
      try {
        const uid = userStore.user?.uid;
        if (!uid) return;
  const id = Date.now().toString();
  await setDoc(doc(db, 'users', uid, 'trainingSessions', id), payload);
      } catch (err) {
        console.error('Error guardando sesión', err);
      }
    })();

    // 3. Volver a la vista semanal
    setViewMode('weekly');
  };

  // Cálculos para Estadísticas en Tiempo Real
  
  const daysLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const daysIds = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  
  // 1. Volumen Real (Actual)
  const actualVolumeData = daysIds.map(id => {
    const daySessions = weekSessions.filter(s => s.dayId === id);
    return daySessions.reduce((acc, s) => acc + (s.exercises?.reduce((eAcc: number, e: any) => eAcc + ((e.actual?.reps || 0) * (e.actual?.weight || 0)), 0) || 0), 0);
  });
  const totalActualVolume = actualVolumeData.reduce((a, b) => a + b, 0);

  // 2. Volumen Planificado (Target)
  const plannedVolumeData = weeklyPlan.map(day => {
    if (!day.exercises) return 0;
    return day.exercises.reduce((acc: number, ex: any) => acc + ((ex.sets || 0) * (ex.reps || 0) * (ex.weight || 0)), 0);
  });
  const totalPlannedVolume = plannedVolumeData.reduce((a, b) => a + b, 0);

  // 3. Conteo de Ejercicios (Done vs Left)
  const totalExercisesCount = weeklyPlan.reduce((acc, day) => acc + (day.exercises?.length || 0), 0);
  // Contar ejercicios únicos completados (basado en IDs únicos de instancia)
  const completedExercisesSet = new Set();
  weekSessions.forEach(s => { if(s.exercises) s.exercises.forEach((e:any) => completedExercisesSet.add(e.exerciseId)); });
  const completedExercisesCount = completedExercisesSet.size;
  const exercisesPercent = totalExercisesCount > 0 ? (completedExercisesCount / totalExercisesCount) * 100 : 0;

  if (viewMode === 'workout') {
    return <WorkoutSession onExit={() => setViewMode('weekly')} onComplete={handleWorkoutComplete} exercises={activeRoutineExercises} />;
  }

  if (viewMode === 'history') {
    return <ClientHistory onBack={() => setViewMode('dashboard')} />;
  }

  if (viewMode === 'tutorials') {
    return <ClientTutorials onBack={() => setViewMode('dashboard')} weeklyPlan={weeklyPlan} />;
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
          {weeklyPlan.map((day) => {
            const todayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date().getDay()];
            const isToday = day.day === todayName;
            
            return (
              <div 
                key={day.id}
                onClick={() => handleDayClick(day)}
                className={`p-4 rounded-xl border transition-all flex items-center justify-between group ${
                  day.type === 'rest' 
                    ? 'bg-slate-900/30 border-slate-800 opacity-70 cursor-default' 
                    : day.isCompleted 
                      ? 'bg-emerald-900/10 border-emerald-500/30 cursor-pointer hover:bg-emerald-900/20' 
                      : isToday 
                        ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500/50 cursor-pointer'
                        : 'bg-slate-900 border-slate-800 cursor-pointer hover:border-blue-500/50 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    day.isCompleted ? 'bg-emerald-500 text-black' : day.type === 'rest' ? 'bg-slate-800 text-slate-500' : isToday ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {day.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : day.day.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className={`font-bold ${day.isCompleted ? 'text-emerald-400' : isToday ? 'text-white' : 'text-slate-200'}`}>
                      {day.day} {isToday && <span className="text-xs text-emerald-500 ml-2 font-normal uppercase tracking-wider">Hoy</span>}
                    </h3>
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
            );
          })}
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

        {/* MÓDULO 2: HISTORIAL (Reemplaza Próxima Semana) */}
        <Card onClick={() => setViewMode('history')} className="relative overflow-hidden group cursor-pointer hover:border-blue-500/50 transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <History className="w-24 h-24 text-blue-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <History className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Historial</h2>
            </div>
            <p className="text-slate-300 mb-6">Consulta tus entrenamientos pasados.</p>
            <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-blue-200">
                Revisa tu progreso, cargas utilizadas y cumplimiento de semanas anteriores.
              </p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setViewMode('history'); }} className="mt-6 w-full py-2 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
              Ver Historial <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </Card>

        {/* MÓDULO 3: ESTADÍSTICAS Y PROGRESO */}
        <Card className="relative overflow-hidden group cursor-pointer hover:border-purple-500/50 transition-all bg-slate-900/80">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 relative">
              <Activity className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-purple-400 rounded-full animate-ping"></span>
            </div>
            <h2 className="text-xl font-bold text-white">Rendimiento Semanal</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4 items-center">
            {/* Gráfico Circular: Ejercicios Completados vs Total */}
            <div className="flex flex-col items-center justify-center p-2 bg-slate-800/30 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold mb-2">Progreso Ejercicios</span>
              <div className="relative">
                <AnimatedCircularProgress value={exercisesPercent} color={exercisesPercent >= 80 ? '#10b981' : '#3b82f6'} />
                <div className="absolute inset-0 flex items-center justify-center pt-4">
                  <span className="text-[10px] text-slate-400">{completedExercisesCount} / {totalExercisesCount}</span>
                </div>
              </div>
            </div>
            
            {/* Estadísticas de Volumen: Real vs Plan */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-800/30 rounded-xl border border-slate-800 h-full">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Carga Total (Vol)</span>
              <div className="text-2xl font-bold text-white mt-1 animate-in zoom-in duration-500">{(totalActualVolume / 1000).toFixed(1)}k</div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div style={{ width: `${Math.min(100, (totalActualVolume / Math.max(1, totalPlannedVolume)) * 100)}%` }} className="h-full bg-purple-500 rounded-full"></div>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">Meta: {(totalPlannedVolume / 1000).toFixed(1)}k</span>
            </div>
          </div>

          {/* Gráfico de Barras Agrupadas: Planificado vs Realizado por día */}
          <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl">
            <div className="flex justify-between items-center mb-1"><span className="text-xs text-slate-400 font-bold uppercase">Planificado vs Realizado</span><TrendingUp className="w-3 h-3 text-blue-400" /></div>
            <AnimatedGroupedBarChart planned={plannedVolumeData} actual={actualVolumeData} labels={daysLabels} />
          </div>
        </Card>

        {/* MÓDULO 4: SUGERENCIAS Y TUTORIALES */}
        <Card onClick={() => setViewMode('tutorials')} className="relative overflow-hidden group cursor-pointer hover:border-yellow-500/50 transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-500/20 rounded-lg text-yellow-400">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Tutoriales</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-5 bg-slate-800/80 rounded-xl border-l-4 border-yellow-500 shadow-lg">
              <p className="text-xs text-yellow-500 font-bold uppercase mb-2 flex items-center gap-2"><Zap className="w-3 h-3" /> Enfoque de la Semana</p>
              <p className="text-lg font-bold text-white leading-tight">
                "{currentRoutineDoc?.name || 'Sin Plan Asignado'}"
              </p>
              <p className="text-sm text-slate-400 mt-2 italic">
                Hoy: <span className="text-white not-italic font-medium">{weeklyPlan.find(d => d.day === ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][new Date().getDay()])?.title || 'Descanso'}</span>
              </p>
            </div>
            
            <button className="w-full flex items-center justify-center gap-2 p-3 bg-slate-800 hover:bg-yellow-600 hover:text-white text-slate-300 rounded-lg transition-colors group/btn font-medium mt-4">
              <Play className="w-4 h-4 text-yellow-500 group-hover/btn:text-white" />
              Ver Tutoriales de Hoy
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover/btn:text-white" />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};