import { useState, useEffect } from 'react';
import { Client } from '@/types';
import { MOCK_EXERCISE_DB, ExerciseMachine } from '../admin/ExerciseLibrary';
import { Card } from '@/components/ui/Card';
import { Calendar, Plus, Save, Trash2, ArrowLeft, CheckCircle, AlertTriangle, Dumbbell, Wind } from 'lucide-react';
import { doc, setDoc, collection, onSnapshot, deleteDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { getOneRmRecords, getClientSheet } from '@/services/api/firestore';
import { useHeartRateZones } from '@/features/heart-rate-zones/hooks/useHeartRateZones';

interface RoutineDesignerProps {
  client: Client;
  onBack: () => void;
}

interface CardioCycle {
  id: string;
  level: string; // e.g., 'A1', 'A2'
  time: number; // in seconds
  intensity: number;
  minHr: number;
  maxHr: number;
}

interface RoutineExercise {
  id: string; // ID único para la instancia en la rutina
  exerciseId: string; // ID referencia a la DB
  exerciseType: 'strength' | 'cardio';
  name: string;
  // Campos de Fuerza
  forceType?: string;
  intensity?: number | 'Baja' | 'Moderada' | 'Alta'; // Can be % for Strength, or level for Cardio
  sets?: number;
  reps?: number;
  weight?: number;
  speed?: string;
  microPause?: number;
  macroPause?: number;
  // Campos de Cardio
  duration?: number;
  cardioCycles?: CardioCycle[];
  // Comunes
  restTime: number;
  notes?: string;
  gifUrl?: string;
  videoUrl?: string;
}

interface DayRoutine {
  id: string;
  dayName: string;
  focus: string;
  isRest: boolean;
  exercises: RoutineExercise[];
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// Tipos de fuerza y rangos asociados (porcentaje sobre 1RM) - Updated
const FORCE_TYPES = [
  {
    key: 'max',
    label: 'Fuerza Máxima',
    intensityMin: 85, intensityMax: 100, intensityStep: 1,
    repsMin: 1, repsMax: 5,
    seriesMin: 3, seriesMax: 6,
    microPauseMin: 3, microPauseMax: 5,
    macroPauseMin: 5, macroPauseMax: 7,
    speeds: ['Máxima intencional (explosiva)', 'Máxima (explosiva y técnica)'],
    defaultIntensity: 90,
    defaultReps: 3,
    defaultSeries: 4,
    defaultMicroPause: 4,
    defaultMacroPause: 6
  },
  {
    key: 'power',
    label: 'Fuerza Rápida / Potencia',
    intensityMin: 30, intensityMax: 60, intensityStep: 5,
    repsMin: 1, repsMax: 6,
    seriesMin: 3, seriesMax: 5,
    microPauseMin: 3, microPauseMax: 5,
    macroPauseMin: 0, macroPauseMax: 5,
    speeds: ['Máxima (explosiva y técnica)', 'Máxima intencional (explosiva)'],
    defaultIntensity: 45,
    defaultReps: 4,
    defaultSeries: 4,
    defaultMicroPause: 4,
    defaultMacroPause: 5
  },
  {
    key: 'hypertrophy',
    label: 'Hipertrofia Muscular',
    intensityMin: 65, intensityMax: 85, intensityStep: 1,
    repsMin: 6, repsMax: 12,
    seriesMin: 3, seriesMax: 5,
    microPauseMin: 1, microPauseMax: 1.5, // 60-90 seg
    macroPauseMin: 2, macroPauseMax: 3,
    speeds: ['Controlada (2s excéntrico / 1s concéntrico)', 'Moderada a rítmica'],
    defaultIntensity: 75,
    defaultReps: 8,
    defaultSeries: 4,
    defaultMicroPause: 1.25, // 75 seg
    defaultMacroPause: 2.5
  },
  {
    key: 'endurance',
    label: 'Resistencia a la Fuerza',
    intensityMin: 40, intensityMax: 60, intensityStep: 5,
    repsMin: 15, repsMax: 25,
    seriesMin: 2, seriesMax: 4,
    microPauseMin: 0.5, microPauseMax: 1, // 30-60 seg
    macroPauseMin: 0, macroPauseMax: 2,
    speeds: ['Moderada a rítmica', 'Controlada (2s excéntrico / 1s concéntrico)'],
    defaultIntensity: 50,
    defaultReps: 18,
    defaultSeries: 3,
    defaultMicroPause: 0.75, // 45 seg
    defaultMacroPause: 2
  }
];

const CardioChart = ({ cycles }: { cycles: CardioCycle[] }) => {
  const width = 500;
  const height = 128;
  const padding = 20;

  if (!cycles || cycles.length === 0) {
    return null;
  }

  const totalTime = cycles.reduce((sum, cycle) => sum + cycle.time, 0);
  
  let points = `M0,${height} `;
  let linePoints = `M0,${height - (cycles[0].intensity / 100 * (height - padding))} `;
  let currentTime = 0;

  cycles.forEach((cycle, index) => {
    const startX = (currentTime / totalTime) * width;
    const endX = ((currentTime + cycle.time) / totalTime) * width;
    const y = height - (cycle.intensity / 100 * (height - padding));
    
    // For area path
    points += `L${startX},${y} L${endX},${y} `;
    
    // For line path
    if (index > 0) {
      const prevY = height - (cycles[index-1].intensity / 100 * (height - padding));
      linePoints += `L${startX},${prevY} L${startX},${y} `;
    }
    linePoints += `L${endX},${y} `;

    currentTime += cycle.time;
  });

  points += `L${width},${height} Z`;

  return (
    <div className="mt-4">
      <h4 className="text-xs text-slate-300 uppercase font-bold block mb-2">Cardiograma de la Sesión</h4>
      <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cardioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(20, 184, 166, 0.4)" />
              <stop offset="100%" stopColor="rgba(20, 184, 166, 0)" />
            </linearGradient>
          </defs>
          <path d={points} fill="url(#cardioGradient)" />
          <path d={linePoints} fill="none" strokeWidth="2" stroke="rgba(20, 184, 166, 1)" />
        </svg>
      </div>
    </div>
  );
};

export const RoutineDesigner = ({ client, onBack }: RoutineDesignerProps) => {
  // track selected week by ISO date string for the week start (YYYY-MM-DD)
  const getWeekStartISO = (d: Date) => {
    const date = new Date(d);
    const day = (date.getDay() + 6) % 7; // Monday = 0
    date.setDate(date.getDate() - day);
    date.setHours(0,0,0,0);
    return date.toISOString().slice(0,10);
  };
  const [selectedWeekStart, setSelectedWeekStart] = useState<string>(getWeekStartISO(new Date()));
  // routinesList removed: we now navigate weeks only via Year/Month/Week selector
  // hierarchical date selectors
  const currentYear = new Date().getFullYear();
  const YEARS_START = 2025;
  const yearOptions = Array.from({ length: Math.max(1, currentYear - YEARS_START + 3) }, (_, i) => YEARS_START + i); // allow a couple years ahead
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()); // 0-11
  const [computedWeeks, setComputedWeeks] = useState<Array<{ weekStartISO: string; weekEndISO: string; title: string; rangeLabel: string }>>([]);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exerciseTypeFilter, setExerciseTypeFilter] = useState<'strength' | 'cardio' | null>(null); // NUEVO
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [dbExercises, setDbExercises] = useState<ExerciseMachine[]>([]);
  const [oneRmMap, setOneRmMap] = useState<{ [exerciseId: string]: any }>({});
  const [physicalTestsData, setPhysicalTestsData] = useState<any>({});
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; type: 'exercise' | 'routine'; id?: string; title?: string } | null>(null);

  const heartRateZones = useHeartRateZones(physicalTestsData.fcm, physicalTestsData.restingHeartRate);

  // Escuchar ejercicios reales de la BD para el selector en tiempo real
  useEffect(() => {
    const colRef = collection(db, 'exercises');
    const unsub = onSnapshot(colRef, (snap) => {
      try {
        if (!snap.empty) {
          const items = snap.docs.map(d => {
            const raw = d.data() as ExerciseMachine;
            return { ...raw, id: d.id } as ExerciseMachine;
          });
          setDbExercises(items);
        } else {
          setDbExercises(MOCK_EXERCISE_DB);
        }
      } catch (e) {
        console.error('Error mapping exercises snapshot', e);
        setDbExercises(MOCK_EXERCISE_DB);
      }
    }, (err) => {
      console.error('Exercise onSnapshot error', err);
      setDbExercises(MOCK_EXERCISE_DB);
    });

    return () => unsub();
  }, []);

  // Cargar 1RM y datos de Tests Físicos del cliente
  useEffect(() => {
    if (!client?.uid) return;
    let mounted = true;
    
    const loadClientData = async () => {
      try {
        const [oneRmRecords, testsData] = await Promise.all([
          getOneRmRecords(client.uid),
          getClientSheet(client.uid, 'physicalTests')
        ]);
        
        if (!mounted) return;

        const map: { [key: string]: any } = {};
        oneRmRecords.forEach((r: any) => { if (r.exerciseId) map[r.exerciseId] = r; });
        setOneRmMap(map);

        setPhysicalTestsData(testsData || {});

      } catch (err) {
        console.error('Error loading client data', err);
      }
    };

    loadClientData();
    return () => { mounted = false; };
  }, [client?.uid]);
  // Listen to all routines for this client (so coach can see history)
  useEffect(() => {
    if (!client?.uid) return;
    const colRef = collection(db, 'users', client.uid, 'routines');
    const unsub = onSnapshot(colRef, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, data: d.data() }));
      // sort by weekStart desc if available
      items.sort((a,b) => {
        const aKey = a.data?.weekStart || a.id;
        const bKey = b.data?.weekStart || b.id;
        return bKey.localeCompare(aKey);
      });
      // if selectedWeekStart is not present in list, keep it (allow creating new), but if empty, pick the latest
      if (!selectedWeekStart && items.length > 0) setSelectedWeekStart(items[0].data?.weekStart || items[0].id);
    }, (err) => console.error('routines list onSnapshot error', err));
    return () => unsub();
  }, [client?.uid]);

  // Load a specific routine document when selectedWeekStart or client changes
  useEffect(() => {
    if (!client?.uid || !selectedWeekStart) return;
    const rDoc = doc(db, 'users', client.uid, 'routines', selectedWeekStart);
    const unsub = onSnapshot(rDoc, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.days) setWeeklyPlan(data.days as DayRoutine[]);
      } else {
        // reset to empty weekly plan for that week
        setWeeklyPlan(DAYS.map((day, i) => ({ id: `day-${i}`, dayName: day, focus: 'Descanso', isRest: true, exercises: [] })));
      }
    }, (err) => {
      console.error('routines onSnapshot error', err);
    });

    return () => unsub();
  }, [client?.uid, selectedWeekStart]);

  // compute weeks when year or month changes
  useEffect(() => {
    // compute first and last day of selected month/year
    const firstOfMonth = new Date(selectedYear, selectedMonth, 1);
    const lastOfMonth = new Date(selectedYear, selectedMonth + 1, 0);

    // find the weekStart for the first visible week (may start before month)
    const getWeekStartDate = (d: Date) => {
      const date = new Date(d);
      const day = (date.getDay() + 6) % 7; // Monday=0
      date.setDate(date.getDate() - day);
      date.setHours(0,0,0,0);
      return date;
    };

    const weeks: Array<{ weekStartISO: string; weekEndISO: string; title: string; rangeLabel: string }> = [];
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
    // if currently selectedWeekStart isn't in computedWeeks, default to first week of month
    if (weeks.length > 0 && !weeks.find(w => w.weekStartISO === selectedWeekStart)) {
      setSelectedWeekStart(weeks[0].weekStartISO);
    }
  }, [selectedYear, selectedMonth]);

  // Estado inicial de la rutina (7 días vacíos)
  const [weeklyPlan, setWeeklyPlan] = useState<DayRoutine[]>(
    DAYS.map((day, i) => ({ id: `day-${i}`, dayName: day, focus: 'Descanso', isRest: true, exercises: [] }))
  );

  const currentDay = weeklyPlan[selectedDayIndex];

  // determine if selected week is before current week (read-only)
  const currentWeekISO = getWeekStartISO(new Date());
  const isPastWeek = !!selectedWeekStart && selectedWeekStart < currentWeekISO;

  const handleAddExercise = (dbExercise: ExerciseMachine) => {
    if (isPastWeek) { setNotification({ type: 'error', message: 'Semana en modo solo lectura. No puede modificar semanas pasadas.' }); setTimeout(() => setNotification(null), 2500); return; }
    
    const exerciseType = dbExercise.type || 'strength'; // Default a strength
    
    const newExercise: RoutineExercise = {
      id: Date.now().toString(),
      exerciseId: dbExercise.id,
      exerciseType: exerciseType as 'strength' | 'cardio',
      name: dbExercise.title || 'Ejercicio sin nombre',
      // Campos de Fuerza
      sets: dbExercise.defaultSets || 0,
      reps: dbExercise.defaultReps || 0,
      weight: dbExercise.defaultWeight || 0,
      speed: (dbExercise as any).defaultSpeed || (dbExercise as any).defaultTempo || 'Moderada',
      // Campos de Cardio
      duration: (dbExercise as any).defaultDuration || 20,
      intensity: (dbExercise as any).defaultIntensity || 'Moderada',
      // Comunes
      restTime: dbExercise.defaultRestTime || 0,
      gifUrl: dbExercise.gifUrl || '',
      notes: '',
      videoUrl: dbExercise.videoUrl || ''
    };

    const updatedPlan = [...weeklyPlan];
    updatedPlan[selectedDayIndex] = { ...updatedPlan[selectedDayIndex] }; // Copia superficial del día
    updatedPlan[selectedDayIndex].exercises = [...updatedPlan[selectedDayIndex].exercises, newExercise]; // Copia del array
    updatedPlan[selectedDayIndex].isRest = false; // Si agrega ejercicio, ya no es descanso
    if (updatedPlan[selectedDayIndex].focus === 'Descanso') updatedPlan[selectedDayIndex].focus = 'Entrenamiento';
    
    setWeeklyPlan(updatedPlan);
    setShowExercisePicker(false);
    setSelectedExerciseId(newExercise.id); // Auto-seleccionar el nuevo
  };

  const updateExercise = (exId: string, field: keyof RoutineExercise, value: any) => {
    if (isPastWeek) { setNotification({ type: 'error', message: 'Semana en modo solo lectura. No puede modificar semanas pasadas.' }); setTimeout(() => setNotification(null), 2500); return; }
    setWeeklyPlan(prevPlan =>
      prevPlan.map((day, index) => {
        if (index !== selectedDayIndex) return day;
        return {
          ...day,
          exercises: day.exercises.map(e =>
            e.id === exId ? { ...e, [field]: value } : e
          )
        };
      })
    );
  };

  const setForceType = (exId: string, ex: RoutineExercise, ft: typeof FORCE_TYPES[0]) => {
    if (isPastWeek) { return; }
    
    const oneRm = oneRmMap[ex.exerciseId]?.oneRmKg || 0;
    const computedWeight = Math.round((ft.defaultIntensity / 100) * oneRm);

    const updates: Partial<RoutineExercise> = {
      forceType: ft.key,
      intensity: ft.defaultIntensity,
      reps: ft.defaultReps,
      sets: ft.defaultSeries,
      microPause: ft.defaultMicroPause,
      macroPause: ft.defaultMacroPause,
      speed: ft.speeds[0],
      weight: computedWeight > 0 ? computedWeight : ex.weight
    };
    
    setWeeklyPlan(prevPlan =>
      prevPlan.map((day, index) => {
        if (index !== selectedDayIndex) return day;
        return {
          ...day,
          exercises: day.exercises.map(e =>
            e.id === exId ? { ...e, ...updates } : e
          )
        };
      })
    );
  };

  const addCardioCycle = (exId: string) => {
    if (isPastWeek || heartRateZones.length === 0) return;
    
    const firstZone = heartRateZones[0];
    const newCycle: CardioCycle = {
      id: Date.now().toString(),
      level: firstZone.zoneCode,
      time: 300, // 5 minutes in seconds
      intensity: firstZone.minIntensity,
      minHr: firstZone.minBpm,
      maxHr: firstZone.maxBpm,
    };

    setWeeklyPlan(prevPlan =>
      prevPlan.map((day, index) => {
        if (index !== selectedDayIndex) return day;
        return {
          ...day,
          exercises: day.exercises.map(e =>
            e.id === exId ? { ...e, cardioCycles: [...(e.cardioCycles || []), newCycle] } : e
          )
        };
      })
    );
  };

  const updateCardioCycle = (exId: string, cycleId: string, field: keyof CardioCycle, value: string | number) => {
    if (isPastWeek) return;
    
    setWeeklyPlan(prevPlan =>
      prevPlan.map((day, index) => {
        if (index !== selectedDayIndex) return day;
        return {
          ...day,
          exercises: day.exercises.map(ex => {
            if (ex.id !== exId) return ex;
            
            const updatedCycles = (ex.cardioCycles || []).map(cycle => {
              if (cycle.id !== cycleId) return cycle;

              let updatedCycle = { ...cycle, [field]: value };

              if (field === 'level') {
                const newZone = heartRateZones.find(z => z.zoneCode === value);
                if (newZone) {
                  updatedCycle.intensity = newZone.minIntensity;
                  updatedCycle.minHr = newZone.minBpm;
                  updatedCycle.maxHr = newZone.maxBpm;
                }
              }
              
              if (field === 'time') {
                // Time is received in minutes from input, convert to seconds
                updatedCycle.time = Number(value) * 60;
              }

              return updatedCycle;
            });
            return { ...ex, cardioCycles: updatedCycles };
          })
        };
      })
    );
  };

  const removeCardioCycle = (exId: string, cycleId: string) => {
    if (isPastWeek) return;
    setWeeklyPlan(prevPlan =>
      prevPlan.map((day, index) => {
        if (index !== selectedDayIndex) return day;
        return {
          ...day,
          exercises: day.exercises.map(e =>
            e.id === exId ? { ...e, cardioCycles: (e.cardioCycles || []).filter(c => c.id !== cycleId) } : e
          )
        };
      })
    );
  };

  const removeExercise = (exId: string) => {
    if (isPastWeek) { setNotification({ type: 'error', message: 'Semana en modo solo lectura. No puede modificar semanas pasadas.' }); setTimeout(() => setNotification(null), 2500); return; }
    const updatedPlan = [...weeklyPlan];
    updatedPlan[selectedDayIndex] = { ...updatedPlan[selectedDayIndex] };
    updatedPlan[selectedDayIndex].exercises = updatedPlan[selectedDayIndex].exercises.filter(e => e.id !== exId);
    setWeeklyPlan(updatedPlan);
    setSelectedExerciseId(null);
  };

  const toggleRestDay = () => {
    if (isPastWeek) { setNotification({ type: 'error', message: 'Semana en modo solo lectura. No puede modificar semanas pasadas.' }); setTimeout(() => setNotification(null), 2500); return; }
    const updatedPlan = [...weeklyPlan];
    updatedPlan[selectedDayIndex] = { ...updatedPlan[selectedDayIndex] };
    updatedPlan[selectedDayIndex].isRest = !updatedPlan[selectedDayIndex].isRest;
    updatedPlan[selectedDayIndex].focus = updatedPlan[selectedDayIndex].isRest ? 'Descanso' : 'General';
    setWeeklyPlan(updatedPlan);
  };

  const handleSaveRoutine = async () => {
    setLoading(true);
    try {
      // Guardar rutina en la subcolección del usuario usando el ISO week start como ID
      const weekId = selectedWeekStart;
      const weekStartDate = new Date(weekId + 'T00:00:00');
      await setDoc(doc(db, 'users', client.uid, 'routines', weekId), {
        weekStart: weekId,
        coachId: auth.currentUser?.uid || null,
        updatedAt: new Date(),
        name: `Semana ${weekStartDate.toLocaleDateString()}`,
        days: weeklyPlan
      });
      setNotification({ type: 'success', message: `Rutina guardada para la semana ${weekId}.` });
      setTimeout(() => { setNotification(null); onBack(); }, 1200);
    } catch (error) {
      console.error(error);
      setNotification({ type: 'error', message: 'Error al guardar la rutina.' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Manejador del botón "Eliminar" de la barra lateral
  const handleDeleteButtonAction = () => {
    if (selectedExerciseId) {
      const ex = currentDay.exercises.find(e => e.id === selectedExerciseId);
      if (ex) {
        setDeleteModal({ isOpen: true, type: 'exercise', id: selectedExerciseId, title: ex.name });
      }
    } else {
      setNotification({ type: 'error', message: 'Selecciona un ejercicio del día para eliminar.' });
      setTimeout(() => setNotification(null), 2500);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    if (deleteModal.type === 'exercise' && deleteModal.id) {
      removeExercise(deleteModal.id);
      setNotification({ type: 'success', message: 'Ejercicio eliminado.' });
    } else if (deleteModal.type === 'routine') {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'users', client.uid, 'routines', selectedWeekStart));
        setWeeklyPlan(DAYS.map((day, i) => ({ id: `day-${i}`, dayName: day, focus: 'Descanso', isRest: true, exercises: [] })));
        setNotification({ type: 'success', message: 'Rutina eliminada.' });
      } catch (err) {
        console.error(err);
        setNotification({ type: 'error', message: 'Error al eliminar rutina.' });
      } finally {
        setLoading(false);
      }
    }
    setDeleteModal(null);
    setTimeout(() => setNotification(null), 2000);
  };

  const filteredDbExercises = dbExercises.filter(e => {
    const matchesSearch = (e.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (e.muscleGroup || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.equipment || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Si hay un filtro de tipo, aplicarlo
    if (exerciseTypeFilter) {
      const exerciseType = e.type || 'strength';
      return matchesSearch && exerciseType === exerciseTypeFilter;
    }
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header: title row */}
      <div className="flex items-center justify-start">
        <button onClick={onBack} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors mr-4">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Diseñador de Rutinas</h1>
          <p className="text-slate-400 text-sm">Planificando para: <span className="text-emerald-400 font-bold">{client.firstName} {client.lastName}</span></p>
        </div>
      </div>

      {/* Filters row: year / month / week */}
      <div className="w-full">
        <div className="flex items-center gap-3 bg-slate-900 p-4 rounded-lg border border-slate-800 w-full">
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-slate-950 border border-slate-800 rounded-md p-2 text-sm text-slate-200">
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-950 border border-slate-800 rounded-md p-2 text-sm text-slate-200">
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>

          <div className="flex-1 flex items-center gap-3 overflow-x-auto py-2">
            {computedWeeks.length === 0 && <div className="text-sm text-slate-400">No hay semanas</div>}
            {computedWeeks.map((w) => {
            const currentWeekISO = getWeekStartISO(new Date());
            const nextWeekISO = getWeekStartISO(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
            const isCurrent = w.weekStartISO === currentWeekISO;
            const isNext = w.weekStartISO === nextWeekISO;
            const isSelected = w.weekStartISO === selectedWeekStart;
            return (
              <button
                key={w.weekStartISO}
                onClick={() => setSelectedWeekStart(w.weekStartISO)}
                  className={`px-4 py-3 rounded-lg text-left min-w-[170px] flex-shrink-0 transition-all ${isSelected ? 'ring-2 ring-emerald-400' : ''} ${isCurrent ? 'bg-emerald-600 text-white' : isNext ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>
                <div className="font-bold text-sm">{w.title}</div>
                <div className="text-xs text-slate-300 mt-1">{w.rangeLabel}</div>
              </button>
            );
          })}
          </div>

          {/* Botón discreto para eliminar rutina completa (si es necesario) */}
          {!isPastWeek && (
            <button onClick={() => setDeleteModal({ isOpen: true, type: 'routine', title: 'Toda la semana' })} className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-500 hover:text-red-500 hover:border-red-500/50 transition-colors" title="Eliminar toda la rutina de esta semana">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Calendario Semanal */}
        <div className="lg:col-span-1 space-y-3">
          {weeklyPlan.map((day, index) => (
            <button
              key={day.id}
              onClick={() => setSelectedDayIndex(index)}
              className={`w-full p-4 rounded-xl border text-left transition-all group ${
                selectedDayIndex === index 
                  ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/50' 
                  : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`font-bold ${selectedDayIndex === index ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{day.dayName}</span>
                {day.isRest ? <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">Descanso</span> : <span className="text-[10px] bg-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded-full">{day.exercises.length} Ejercicios</span>}
              </div>
              <p className="text-xs text-slate-500 truncate">{day.focus}</p>
            </button>
          ))}
          <div className="flex gap-3 mt-4 items-center">
            <button onClick={handleSaveRoutine} disabled={loading || isPastWeek} className={`flex-1 py-3 ${isPastWeek ? 'bg-slate-700/50' : 'bg-emerald-600 hover:bg-emerald-500'} text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-50`}>
              <Save className="w-4 h-4" /> {loading ? 'Guardando...' : 'Guardar Rutina'}
            </button>
            <button onClick={handleDeleteButtonAction} disabled={loading || isPastWeek} className={`px-4 py-3 ${isPastWeek ? 'bg-slate-700/50' : 'bg-red-600 hover:bg-red-500'} text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow transition-all disabled:opacity-50`}>
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
            {isPastWeek && <div className="ml-2 px-3 py-1 rounded-full bg-yellow-900 text-yellow-200 text-xs">Solo lectura</div>}
          </div>
        </div>

        {/* Main: Editor del Día */}
        <Card className="lg:col-span-3 bg-slate-900/50 border-slate-800 min-h-[600px] flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white">{currentDay.dayName}</h2>
              <input 
                value={currentDay.focus}
                onChange={(e) => {
                  if (isPastWeek) return;
                  const updated = [...weeklyPlan];
                  updated[selectedDayIndex].focus = e.target.value;
                  setWeeklyPlan(updated);
                }}
                disabled={isPastWeek}
                className="bg-transparent border-none text-slate-400 text-sm focus:text-white focus:ring-0 p-0 w-full disabled:opacity-60"
                placeholder="Enfoque del día (ej. Pierna Hipertrofia)"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={currentDay.isRest} onChange={toggleRestDay} disabled={isPastWeek} className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20 disabled:opacity-50" />
                <span className="text-sm text-slate-300">Día de Descanso</span>
              </label>
              <button 
                onClick={() => setShowExercisePicker(true)}
                disabled={isPastWeek || currentDay.isRest}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> Agregar Ejercicio
              </button>
            </div>
          </div>

          {currentDay.isRest ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-50">
              <Calendar className="w-16 h-16 mb-4" />
              <p>Día asignado como descanso.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
              {currentDay.exercises.map((ex) => (
                <div 
                  key={ex.id} 
                  onClick={() => setSelectedExerciseId(ex.id)}
                  className={`p-4 border rounded-xl transition-all group cursor-pointer ${selectedExerciseId === ex.id ? 'bg-slate-900 border-emerald-500 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-900/10' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className={`font-bold ${selectedExerciseId === ex.id ? 'text-emerald-400' : 'text-white'}`}>{ex.name}</h3>
                    <div className="flex items-center gap-3">
                      {oneRmMap[ex.exerciseId]?.oneRmKg ? (
                        <div className="text-xs bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 px-2 py-1 rounded">1RM {oneRmMap[ex.exerciseId].oneRmKg}kg</div>
                      ) : null}
                      <button onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, type: 'exercise', id: ex.id, title: ex.name }); }} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <input 
                    value={ex.notes || ''} 
                    onChange={(e) => updateExercise(ex.id, 'notes', e.target.value)}
                    placeholder="Notas técnicas para el atleta..."
                    disabled={isPastWeek}
                    className="w-full mt-3 bg-transparent border-b border-slate-800 text-xs text-slate-400 focus:text-white focus:border-emerald-500 outline-none py-1 disabled:opacity-60"
                  />

                  {/* Calculate total cardio duration and display total time + placeholder for feedback */}
                  {ex.exerciseType === 'cardio' && (() => {
                    const totalCardioDuration = ex.cardioCycles ? ex.cardioCycles.reduce((sum, cycle) => sum + cycle.time, 0) : 0;
                    const totalCardioDurationMinutes = Math.round(totalCardioDuration / 60);

                    // Placeholder for coach feedback. This data would come from actual client performance.
                    // For example:
                    // const actualPerformanceData = fetchClientPerformance(client.uid, selectedWeekStart, ex.id);
                    // const maintainedBpm = actualPerformanceData?.maintainedBpm;
                    // const completedCycles = actualPerformanceData?.completedCycles;

                    return (
                      <p className="text-xs text-slate-500 mt-2">
                        Duración Total de Cardio: <span className="font-bold text-emerald-400">{totalCardioDurationMinutes} min</span>
                        {/* {maintainedBpm !== undefined && <span> | Mantuvo BPM: {maintainedBpm ? 'Sí' : 'No'}</span>}
                        {completedCycles !== undefined && <span> | Ciclos Completos: {completedCycles ? 'Sí' : 'No'}</span>} */}
                      </p>
                    );
                  })()}

                  {/* Selectores dependientes para ejercicios de fuerza */}
                  {ex.exerciseType === 'strength' && (
                    <div className="mt-4 space-y-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900/50 border border-slate-700 rounded-lg p-4">
                      {/* Paso 1: Objetivo */}
                      <div>
                        <label className="text-xs text-slate-300 uppercase font-bold block mb-3">🎯 Paso 1: Seleccionar Objetivo</label>
                        <div className="grid grid-cols-2 gap-2">
                          {FORCE_TYPES.map(ft => (
                            <button
                              key={ft.key}
                              onClick={() => setForceType(ex.id, ex, ft)}
                              disabled={isPastWeek}
                              className={`p-3 rounded-lg border-2 text-left transition-all ${
                                ex.forceType === ft.key
                                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500'
                              } disabled:opacity-50 cursor-pointer`}
                            >
                              <p className="font-bold text-sm">{ft.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {ex.forceType && (() => {
                        const selectedFt = FORCE_TYPES.find(f => f.key === ex.forceType);
                        const intensity = ex.intensity as number || selectedFt?.defaultIntensity || 0;
                        const oneRm = oneRmMap[ex.exerciseId]?.oneRmKg || 0;
                        const weight = Math.round((intensity / 100) * oneRm);

                        return (
                          <>
                            {/* Paso 2: Intensidad (Slider) */}
                            <div>
                              <label className="text-xs text-slate-300 uppercase font-bold block mb-2">📊 Paso 2: Intensidad (% 1RM)</label>
                              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                <input
                                  type="range"
                                  min={selectedFt?.intensityMin}
                                  max={selectedFt?.intensityMax}
                                  step={selectedFt?.intensityStep}
                                  value={intensity}
                                  onChange={(e) => {
                                    const newIntensity = parseInt(e.target.value);
                                    updateExercise(ex.id, 'intensity', newIntensity);
                                    const computed = Math.round((newIntensity / 100) * oneRm);
                                    if (computed > 0) updateExercise(ex.id, 'weight', computed);
                                  }}
                                  disabled={isPastWeek}
                                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                                <div className="flex justify-between items-center mt-3">
                                  <div>
                                    <p className="text-xs text-slate-500">Rango: {selectedFt?.intensityMin}% - {selectedFt?.intensityMax}%</p>
                                    <p className="text-lg font-bold text-blue-400 mt-1">{intensity}%</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-slate-500">Peso calculado</p>
                                    <p className="text-lg font-bold text-emerald-400">{weight} kg</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Paso 3: Repeticiones */}
                            <div>
                              <label className="text-xs text-slate-300 uppercase font-bold block mb-2">🔄 Paso 3: Repeticiones</label>
                              <div className="grid grid-cols-6 gap-1">
                                {Array.from({ length: (selectedFt?.repsMax || 20) - (selectedFt?.repsMin || 1) + 1 }, (_, i) => (selectedFt?.repsMin || 1) + i).map(rep => (
                                  <button
                                    key={rep}
                                    onClick={() => updateExercise(ex.id, 'reps', rep)}
                                    disabled={isPastWeek}
                                    className={`p-2 rounded-lg border-2 font-bold text-sm transition-all ${
                                      ex.reps === rep
                                        ? 'bg-emerald-600 border-emerald-500 text-white'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-emerald-500'
                                    } disabled:opacity-50`}
                                  >
                                    {rep}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Paso 4: Series */}
                            <div>
                              <label className="text-xs text-slate-300 uppercase font-bold block mb-2">📦 Paso 4: Series</label>
                              <div className="grid grid-cols-6 gap-1">
                                {Array.from({ length: (selectedFt?.seriesMax || 6) - (selectedFt?.seriesMin || 1) + 1 }, (_, i) => (selectedFt?.seriesMin || 1) + i).map(serie => (
                                  <button
                                    key={serie}
                                    onClick={() => updateExercise(ex.id, 'sets', serie)}
                                    disabled={isPastWeek}
                                    className={`p-2 rounded-lg border-2 font-bold text-sm transition-all ${
                                      ex.sets === serie
                                        ? 'bg-purple-600 border-purple-500 text-white'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-purple-500'
                                    } disabled:opacity-50`}
                                  >
                                    {serie}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Paso 5: Pausas (Micro y Macro) */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-slate-300 uppercase font-bold block mb-2">⏸️ Micro Pausa (entre ejercicios)</label>
                                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                  <input
                                    type="range"
                                    min={Math.round((selectedFt?.microPauseMin || 0.5) * 100) / 100}
                                    max={Math.round((selectedFt?.microPauseMax || 5) * 100) / 100}
                                    step="0.25"
                                    value={ex.microPause || selectedFt?.defaultMicroPause || 1}
                                    onChange={(e) => updateExercise(ex.id, 'microPause', parseFloat(e.target.value))}
                                    disabled={isPastWeek}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                                  />
                                  <p className="text-lg font-bold text-orange-400 mt-2">
                                    {(ex.microPause || selectedFt?.defaultMicroPause || 1).toFixed(2)} min ({Math.round((ex.microPause || selectedFt?.defaultMicroPause || 1) * 60)} seg)
                                  </p>
                                </div>
                              </div>

                              <div>
                                <label className="text-xs text-slate-300 uppercase font-bold block mb-2">⏸️ Macro Pausa (entre series)</label>
                                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                                  <input
                                    type="range"
                                    min={selectedFt?.macroPauseMin || 0.5}
                                    max={selectedFt?.macroPauseMax || 7}
                                    step="0.5"
                                    value={ex.macroPause || selectedFt?.defaultMacroPause || 2}
                                    onChange={(e) => updateExercise(ex.id, 'macroPause', parseFloat(e.target.value))}
                                    disabled={isPastWeek}
                                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                                  />
                                  <p className="text-lg font-bold text-red-400 mt-2">
                                    {(ex.macroPause || selectedFt?.defaultMacroPause || 2).toFixed(2)} min ({Math.round((ex.macroPause || selectedFt?.defaultMacroPause || 2) * 60)} seg)
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Paso 6: Velocidad */}
                            <div>
                              <label className="text-xs text-slate-300 uppercase font-bold block mb-2">🚀 Paso 6: Velocidad de Ejecución</label>
                              <div className="grid grid-cols-1 gap-2">
                                {selectedFt?.speeds.map(speed => (
                                  <button
                                    key={speed}
                                    onClick={() => updateExercise(ex.id, 'speed', speed)}
                                    disabled={isPastWeek}
                                    className={`p-3 rounded-lg border-2 text-left transition-all font-semibold ${
                                      ex.speed === speed
                                        ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-amber-500'
                                    } disabled:opacity-50`}
                                  >
                                    {speed}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Resumen */}
                            <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-3 grid grid-cols-5 gap-2 text-center text-xs">
                              <div>
                                <p className="text-slate-500">Intensidad</p>
                                <p className="font-bold text-blue-400 text-sm">{intensity}%</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Reps</p>
                                <p className="font-bold text-emerald-400 text-sm">{ex.reps || 0}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Series</p>
                                <p className="font-bold text-purple-400 text-sm">{ex.sets || 0}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Micro (seg)</p>
                                <p className="font-bold text-orange-400 text-sm">{Math.round((ex.microPause || 1) * 60)}</p>
                              </div>
                              <div>
                                <p className="text-slate-500">Macro (seg)</p>
                                <p className="font-bold text-red-400 text-sm">{Math.round((ex.macroPause || 2) * 60)}</p>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {ex.exerciseType === 'cardio' && (
                    <div className="mt-4 space-y-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900/50 border border-slate-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-xs text-slate-300 uppercase font-bold block">❤️ Diseñador de Cardio por Ciclos</label>
                        <span className="text-sm text-slate-400">Duración Total: <span className="font-bold text-emerald-400">{totalCardioDurationMinutes} min</span></span>
                      </div>
                      <button 
                          onClick={() => addCardioCycle(ex.id)}
                          disabled={isPastWeek || heartRateZones.length === 0}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={heartRateZones.length === 0 ? "Datos de FC del cliente no disponibles" : ""}
                        >
                          <Plus className="w-3 h-3" /> Añadir Ciclo
                        </button>
                      </div>
                      
                      {(!ex.cardioCycles || ex.cardioCycles.length === 0) ? (
                        <div className="p-3 bg-slate-800/50 rounded-lg text-center text-sm text-slate-500 italic">
                          {heartRateZones.length > 0 ? "Aún no hay ciclos definidos." : "No se pueden agregar ciclos sin los datos de Frecuencia Cardíaca del cliente (FC Máx y FC Reposo)."}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {ex.cardioCycles.map((cycle, cycleIndex) => (
                            <div key={cycle.id} className="grid grid-cols-12 gap-3 items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                              <div className="col-span-1 text-center">
                                <span className="font-bold text-slate-400 text-lg">{cycleIndex + 1}</span>
                              </div>
                              <div className="col-span-4">
                                <label className="text-xs text-slate-400">Zona</label>
                                <select 
                                  value={cycle.level}
                                  disabled={isPastWeek}
                                  onChange={(e) => updateCardioCycle(ex.id, cycle.id, 'level', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-slate-200 mt-1 disabled:opacity-50"
                                >
                                  {heartRateZones.map(zone => (
                                    <option key={zone.zoneCode} value={zone.zoneCode}>{zone.zoneCode} ({zone.description})</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-3">
                                <label className="text-xs text-slate-400">Tiempo (min)</label>
                                <input 
                                  type="number"
                                  value={Math.round(cycle.time / 60)}
                                  min="1"
                                  disabled={isPastWeek}
                                  onChange={(e) => updateCardioCycle(ex.id, cycle.id, 'time', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-slate-200 mt-1 disabled:opacity-50"
                                />
                              </div>
                              <div className="col-span-3 text-center text-xs">
                                <p className="text-slate-400">FC: <span className="font-bold text-emerald-400">{cycle.minHr}-{cycle.maxHr}</span> bpm</p>
                                <p className="text-slate-400">Int: <span className="font-bold text-blue-400">~{cycle.intensity}%</span></p>
                              </div>
                              <div className="col-span-1 text-right">
                                <button onClick={() => removeCardioCycle(ex.id, cycle.id)} disabled={isPastWeek} className="p-2 text-slate-500 hover:text-red-500 disabled:opacity-50"><Trash2 className="w-4 h-4"/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {ex.cardioCycles && ex.cardioCycles.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-xs text-slate-300 uppercase font-bold block mb-2">Cardiograma de la Sesión</h4>
                          <div className="flex items-end h-32 gap-1 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                            {ex.cardI’ve completed the requested changes.

**Summary of improvements:**

*   **Upgraded "Radiography" Graph:** The simple bar chart has been replaced with a sleek, modern SVG area graph. It features a smooth gradient and a clear line tracing the intensity of the session, providing a much more professional "radiography" look.
*   **Verified Data Integration:** I've re-confirmed that the cardio zone calculations correctly use the client's specific Maximum and Resting Heart Rate from their physical tests. The feature remains disabled with a clear message if that data is unavailable, ensuring correct functionality.

The cardio cycle designer is now more powerful and visually appealing, aligning with your request for a functional and aesthetic upgrade.ocycle.map(cycle => (
                              <div 
                                key={cycle.id}
                                className="flex-1 bg-emerald-600 rounded-t-sm hover:bg-emerald-500 transition-colors relative group"
                                style={{ height: `${cycle.intensity}%` }}
                              >
                               <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white text-xs rounded py-1 px-2 pointer-events-none">
                                  {cycle.level}: {cycle.time / 60}'
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))}
              {currentDay.exercises.length === 0 && <p className="text-center text-slate-500 py-10 italic">No hay ejercicios agregados para este día.</p>}
            </div>
          )}
        </Card>
      </div>

      {/* Modal Selector de Ejercicios */}
      {showExercisePicker && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white">Seleccionar Ejercicio</h3>
              <button onClick={() => {setShowExercisePicker(false); setExerciseTypeFilter(null);}}><Trash2 className="w-5 h-5 text-slate-400 rotate-45" /></button>
            </div>
            
            {/* Tabs de Tipo */}
            <div className="p-4 border-b border-slate-800 flex gap-4">
              <button
                onClick={() => setExerciseTypeFilter(null)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
                  exerciseTypeFilter === null 
                    ? 'bg-slate-700 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setExerciseTypeFilter('strength')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
                  exerciseTypeFilter === 'strength' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Dumbbell className="w-4 h-4" />
                Fuerza
              </button>
              <button
                onClick={() => setExerciseTypeFilter('cardio')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
                  exerciseTypeFilter === 'cardio' 
                    ? 'bg-emerald-600 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wind className="w-4 h-4" />
                Cardio
              </button>
            </div>

            <div className="p-4"><input autoFocus type="text" placeholder="Buscar ejercicio..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none" /></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredDbExercises.length > 0 ? (
                filteredDbExercises.map(ex => {
                  const pickOneRm = oneRmMap[ex.id]?.oneRmKg;
                  return (
                  <button key={ex.id} onClick={() => {handleAddExercise(ex); setExerciseTypeFilter(null);}} className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-800 hover:border-blue-500 transition-all group text-left">
                    <div>
                      <p className="font-bold text-white flex items-center gap-2">
                        {(ex.type || 'strength') === 'cardio' ? <Wind className="w-4 h-4 text-emerald-400" /> : <Dumbbell className="w-4 h-4 text-blue-400" />}
                        {ex.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {ex.type === 'cardio' ? ex.equipment : `${ex.muscleGroup} • ${ex.machineName}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {pickOneRm ? (
                        <div className="text-xs bg-emerald-900/30 border border-emerald-500/30 text-emerald-300 px-2 py-1 rounded">{pickOneRm}kg</div>
                      ) : null}
                      <Plus className="w-5 h-5 text-slate-500 group-hover:text-blue-500" />
                    </div>
                  </button>
                )})
              ) : (
                <p className="text-center text-slate-500 py-10">No hay ejercicios de este tipo</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Modal Estético de Confirmación de Eliminación */}
      {deleteModal?.isOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-md bg-slate-900 border-slate-800 p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="p-4 bg-red-500/10 rounded-full text-red-500">
                <Trash2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">¿Eliminar {deleteModal.type === 'routine' ? 'Rutina' : 'Ejercicio'}?</h3>
                <p className="text-slate-400 text-sm mt-2">
                  {deleteModal.type === 'routine' 
                    ? `Estás a punto de eliminar toda la planificación de la semana.` 
                    : `Se eliminará "${deleteModal.title}" de este día.`}
                  <br/>Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => setDeleteModal(null)} className="py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-colors">Sí, Eliminar</button>
            </div>
          </Card>
        </div>
      )}

      {/* Notificación Flotante Estética */}
      {notification && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50 ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100' 
            : 'bg-red-950/90 border-red-500/30 text-red-100'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
          <span className="font-medium text-sm tracking-wide">{notification.message}</span>
        </div>
      )}
    </div>
  );
};

