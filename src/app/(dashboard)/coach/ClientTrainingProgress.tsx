import { useState, useEffect } from 'react';
import { Client } from '@/types';
import { ArrowLeft, Dumbbell, ChevronDown, ChevronUp, CheckCircle2, Zap, Calendar, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface ClientTrainingProgressProps {
  client: Client;
  onBack: () => void;
}

// Utilities
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

// Componentes Gráficos Estéticos (Donut y Barras)
const DonutChart = ({ value, size = 100, strokeWidth = 8, color = "#10b981", label = "" }: { value: number, size?: number, strokeWidth?: number, color?: string, label?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} stroke="#1e293b" strokeWidth={strokeWidth} fill="transparent" />
          <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-white">{Math.round(value)}%</span>
        </div>
      </div>
      {label && <span className="text-xs text-slate-400 mt-2 font-medium uppercase tracking-wider text-center">{label}</span>}
    </div>
  );
};

const BarGroup = ({ label, planned, actual, color }: { label: string, planned: number, actual: number, color: string }) => {
  const max = Math.max(planned, actual, 1) * 1.2; 
  return (
    <div className="flex flex-col items-center bg-slate-950/30 p-4 rounded-xl border border-slate-800/50 w-full">
      <div className="flex items-end gap-3 h-[80px] w-full justify-center px-2 mb-2">
        <div className="flex flex-col items-center gap-1 w-8 h-full justify-end"><div style={{ height: `${(planned/max)*100}%` }} className="w-full bg-slate-700 rounded-t-sm transition-all duration-500 relative min-h-[4px]"></div></div>
        <div className="flex flex-col items-center gap-1 w-8 h-full justify-end"><div style={{ height: `${(actual/max)*100}%`, backgroundColor: color }} className="w-full rounded-t-sm transition-all duration-500 relative min-h-[4px]"></div></div>
      </div>
      <div className="w-full border-t border-slate-800 pt-2 mt-1">
        <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold mb-1"><span>Plan: {planned}</span><span style={{ color }}>Real: {actual}</span></div>
        <div className="text-center text-xs font-bold text-white">{label}</div>
      </div>
    </div>
  );
};

export const ClientTrainingProgress = ({ client, onBack }: ClientTrainingProgressProps) => {
  const [routines, setRoutines] = useState<Array<{ id: string; data: any }>>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<any|null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [chartData, setChartData] = useState<{
    title: string;
    plannedSeries: number; actualSeries: number;
    plannedReps: number; actualReps: number;
    plannedKg: number; actualKg: number;
  } | null>(null);
  const [notification, setNotification] = useState<{ type: 'success'|'error', message: string } | null>(null);

  // Calendar state for simple month navigation
    const [viewDate] = useState(new Date());
    const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    const currentYear = new Date().getFullYear();
    const YEARS_START = 2025;
    const yearOptions = Array.from({ length: Math.max(1, currentYear - YEARS_START + 3) }, (_, i) => YEARS_START + i);
    const [selectedYear, setSelectedYear] = useState<number>(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number>(viewDate.getMonth());
    const [computedWeeks, setComputedWeeks] = useState<Array<{ weekStartISO: string; weekEndISO: string; title: string; rangeLabel: string }>>([]);
    const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);

    // compute weeks for selected month/year (to populate chips)
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
      if (weeks.length > 0 && !weeks.find(w => w.weekStartISO === selectedWeekStart)) {
        setSelectedWeekStart(weeks[0].weekStartISO);
        setSelectedRoutineId(weeks[0].weekStartISO);
      }
    }, [selectedYear, selectedMonth]);

  // Load available routines for this client (listen realtime)
  useEffect(() => {
    if (!client?.uid) return;
    const colRef = collection(db, 'users', client.uid, 'routines');
    const unsub = onSnapshot(colRef, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, data: d.data() }));
      setRoutines(items.sort((a,b) => {
        const ta = a.data?.updatedAt?.toDate ? a.data.updatedAt.toDate().getTime() : 0;
        const tb = b.data?.updatedAt?.toDate ? b.data.updatedAt.toDate().getTime() : 0;
        return tb - ta;
      }));
    });
    return () => unsub();
  }, [client?.uid]);

  // When selectedRoutineId changes, update selectedRoutine and fetch sessions for that week's range
  useEffect(() => {
    if (!client?.uid || !selectedRoutineId) return;
    const found = routines.find(r => r.id === selectedRoutineId);
    setSelectedRoutine(found?.data ?? null);

    // compute week range from the routine (if routine stores a date) or from today
    const anchor = found?.data?.startDate ? new Date(found.data.startDate.seconds ? found.data.startDate.seconds * 1000 : found.data.startDate) : new Date();
    const weekStart = getWeekStart(anchor);
    const weekEnd = getWeekEnd(weekStart);

    const sessionsCol = collection(db, 'users', client.uid, 'trainingSessions');
    const q = query(sessionsCol, where('createdAt', '>=', weekStart), where('createdAt', '<=', weekEnd));
    
    // Escuchar en tiempo real para actualizaciones inmediatas cuando el cliente finaliza
    const unsubSessions = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, data: d.data() })));
    }, (e) => {
      console.error(e);
      setNotification({ type: 'error', message: 'Error cargando sesiones' });
    });
    return () => unsubSessions();
  }, [selectedRoutineId, routines, client?.uid]);

  const toggleDay = (dayIndex: number) => setExpandedDay(expandedDay === dayIndex ? null : dayIndex);

  const computePlannedVolume = (routine: any) => {
    if (!routine?.days) return 0;
    let total = 0;
    routine.days.forEach((d: any) => d.exercises?.forEach((ex: any) => {
      const sets = ex.sets || ex.plan?.sets || 0;
      const reps = ex.reps || ex.plan?.reps || 0;
      const weight = ex.weight || ex.plan?.weight || 0;
      total += sets * reps * weight;
    }));
    return total;
  };

  const computeActualVolume = (sessionsList: any[]) => {
    let total = 0;
    sessionsList.forEach(s => {
      const exs = s.data?.exercises || [];
      exs.forEach((ex: any) => {
        // Corrección: El cliente envía datos por serie individual.
        // Volumen = reps * peso de esa serie específica.
        const reps = ex.actual?.reps || 0;
        const weight = ex.actual?.weight || 0;
        total += reps * weight;
      });
    });
    return total;
  };

  const planned = computePlannedVolume(selectedRoutine);
  const actual = computeActualVolume(sessions);
  const compliance = planned > 0 ? Math.round((actual / planned) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Progreso & Feedback</h1>
            <p className="text-slate-400 text-sm">Cliente: {client ? `${client.firstName} ${client.lastName}` : ''}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 rounded-lg border border-slate-800">
          <span className="text-slate-400 text-xs uppercase font-bold">Cumplimiento:</span>
          <span className={`font-bold ${compliance >= 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {compliance}%
          </span>
        </div>
      </div>


      {/* Single filter card: year/month/week chips (replaces volume + routines cards) */}
      <div>
        <Card className="bg-slate-900/50 border-slate-800 w-full">
          <div className="w-full p-4">
            <div className="flex items-center gap-3 w-full">
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-slate-950 border border-slate-800 rounded-md p-2 text-sm text-slate-200">
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>

              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="bg-slate-950 border border-slate-800 rounded-md p-2 text-sm text-slate-200">
                {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>

              <div className="flex-1 flex items-center gap-3 overflow-x-auto py-2">
                {computedWeeks.length === 0 && <div className="text-sm text-slate-400">No hay semanas</div>}
                {computedWeeks.map((w) => {
                  const currentWeekISO = (() => {
                    const d = new Date();
                    const day = (d.getDay() + 6) % 7;
                    d.setDate(d.getDate() - day);
                    d.setHours(0,0,0,0);
                    return d.toISOString().slice(0,10);
                  })();
                  const nextWeekISO = (() => {
                    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    const day = (d.getDay() + 6) % 7;
                    d.setDate(d.getDate() - day);
                    d.setHours(0,0,0,0);
                    return d.toISOString().slice(0,10);
                  })();
                  const isCurrent = w.weekStartISO === currentWeekISO;
                  const isNext = w.weekStartISO === nextWeekISO;
                  const isSelected = w.weekStartISO === selectedWeekStart;
                  return (
                    <button key={w.weekStartISO} onClick={() => { setSelectedWeekStart(w.weekStartISO); setSelectedRoutineId(w.weekStartISO); }} className={`px-4 py-3 rounded-lg text-left min-w-[170px] flex-shrink-0 transition-all ${isSelected ? 'ring-2 ring-emerald-400' : ''} ${isCurrent ? 'bg-emerald-600 text-white' : isNext ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>
                      <div className="font-bold text-sm">{w.title}</div>
                      <div className="text-xs text-slate-300 mt-1">{w.rangeLabel}</div>
                    </button>
                  );
                })}
                </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Detalle por Día */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Dumbbell className="w-5 h-5 text-emerald-500" /> Detalle de Sesiones</h2>

        {!selectedRoutine && <Card className="p-4">Selecciona una rutina para ver detalles.</Card>}

        {selectedRoutine?.days?.map((day: any, dayIndex: number) => {
          const isRest = day.isRest;
          const hasExercises = day.exercises && day.exercises.length > 0;
          
          const isDayCompleted = hasExercises && day.exercises.every((e: any) => {
            return sessions.some(s => (s.data?.exercises || []).some((ae: any) => ae.exerciseId === e.id));
          });

          // Determinar estilos visuales según estado
          let cardStyle = 'bg-slate-900/30 border-slate-800';
          let iconStyle = 'bg-slate-800 text-slate-500 border-slate-700';
          let iconContent = <span className="font-bold text-xs">{day.dayName?.substring(0,2) || 'D'}</span>;
          let titleColor = 'text-white';
          let statusBadge = null;

          if (isRest) {
             cardStyle = 'bg-slate-800/40 border-slate-700 opacity-75';
             iconStyle = 'bg-slate-700 text-slate-400 border-slate-600';
             iconContent = <Calendar className="w-5 h-5" />;
             titleColor = 'text-slate-400';
             statusBadge = <span className="px-2 py-0.5 rounded-full bg-slate-700/50 border border-slate-600 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descanso</span>;
          } else if (isDayCompleted) {
             cardStyle = 'bg-emerald-950/10 border-emerald-500/30 shadow-lg shadow-emerald-900/10';
             iconStyle = 'bg-emerald-500 text-black border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]';
             iconContent = <CheckCircle2 className="w-6 h-6" />;
             titleColor = 'text-emerald-400';
             statusBadge = (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 animate-in fade-in zoom-in">
                  <Zap className="w-3 h-3" /> Revisión Lista
                </span>
             );
          } else if (hasExercises) {
             cardStyle = 'bg-blue-900/10 border-blue-500/30';
             iconStyle = 'bg-blue-600 text-white border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]';
             iconContent = <Clock className="w-5 h-5" />;
             titleColor = 'text-blue-400';
             statusBadge = <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-[10px] font-bold text-blue-400 uppercase tracking-wider">Planificado</span>;
          }

          return (
          <div key={dayIndex} className={`border rounded-xl overflow-hidden transition-all duration-300 ${cardStyle}`}>
            <button onClick={() => toggleDay(dayIndex)} className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${iconStyle}`}>
                  {iconContent}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <div className={`font-bold text-lg ${titleColor}`}>{day.dayName || day.name || day.day}</div>
                    {statusBadge}
                  </div>
                  {/* compute the date for this day based on selectedWeekStart (week start) */}
                  {selectedWeekStart && (
                    <div className="text-sm text-slate-400">{(() => {
                      try {
                        const base = new Date(selectedWeekStart);
                        const d = new Date(base);
                        d.setDate(base.getDate() + dayIndex);
                        return d.toLocaleDateString();
                      } catch (e) {
                        return '';
                      }
                    })()}</div>
                  )}
                </div>
                <span className="text-sm text-slate-400">{day.focus ? `- ${day.focus}` : ''}</span>
              </div>
              {expandedDay === dayIndex ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
            </button>

            {expandedDay === dayIndex && (
              <div className="p-4 border-t border-slate-800 bg-slate-950/30">
                <div className="grid grid-cols-12 gap-4 text-xs text-slate-500 uppercase font-bold mb-3 px-2">
                  <div className="col-span-4">Ejercicio</div>
                  <div className="col-span-2 text-center">Planificado</div>
                  <div className="col-span-3 text-center">Realizado (agregado)</div>
                  <div className="col-span-3 text-center">Diferencia</div>
                </div>
                <div className="space-y-2">
                  {day.exercises?.map((ex: any) => {
                    // aggregate actuals for this exercise across sessions
                    let actualSets = 0;
                    let actualRepsTotal = 0;
                    let actualVolume = 0;

                    sessions.forEach(s => {
                      (s.data?.exercises || []).forEach((ae: any) => {
                        // Corrección: Comparar con exerciseId y sumar acumulativos
                        if (ae.exerciseId === ex.id) {
                          actualSets += 1; // Cada registro es 1 serie
                          const r = ae.actual?.reps || 0;
                          const w = ae.actual?.weight || 0;
                          actualRepsTotal += r;
                          actualVolume += (r * w);
                        }
                      });
                    });

                    const plannedSets = ex.sets || ex.plan?.sets || 0;
                    const plannedRepsPerSet = ex.reps || ex.plan?.reps || 0;
                    const plannedWeight = ex.weight || ex.plan?.weight || 0;
                    const plannedSeries = plannedSets;
                    const plannedRepsTotal = plannedSets * plannedRepsPerSet;
                    const plannedKg = plannedSets * plannedRepsPerSet * plannedWeight;

                    const actualSeries = actualSets;
                    // actualRepsTotal ya está sumado arriba
                    const actualKg = actualVolume;
                    const isUnder = actualKg < plannedKg;
                    return (
                      <div key={ex.id} className="grid grid-cols-12 gap-4 items-center p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <div className="col-span-4 font-medium text-white">{ex.name}</div>
                        <div className="col-span-2 text-center text-slate-400">{ex.sets || ex.plan?.sets}x{ex.reps || ex.plan?.reps} @ {ex.weight || ex.plan?.weight}kg</div>
                        <div className="col-span-3 text-center text-white font-bold">{actualSets} series | {actualVolume}kg Vol.</div>
                        <div className="col-span-2 flex justify-center">{isUnder ? <span className="text-red-400">Bajo</span> : <span className="text-emerald-400">OK</span>}</div>
                        <div className="col-span-1 flex items-center justify-center">
                          <button onClick={() => setChartData({ title: ex.name, plannedSeries, actualSeries, plannedReps: plannedRepsTotal, actualReps: actualRepsTotal, plannedKg, actualKg })} className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 text-slate-200">Ver estadístico</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>

      {notification && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 ${notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100' : 'bg-red-950/90 border-red-500/30 text-red-100'}`}>
          <span className="font-medium text-sm tracking-wide">{notification.message}</span>
        </div>
      )}
      {/* Chart modal */}
      {chartData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setChartData(null)} />
          <div className="relative bg-slate-900 rounded-2xl p-6 w-[min(720px,98%)] border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Estadístico: {chartData.title}</h3>
              <button onClick={() => setChartData(null)} className="text-sm text-slate-400 px-2 py-1 hover:text-white">Cerrar</button>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center justify-center mb-6">
              {/* Donut Chart Principal */}
              <div className="p-4">
                {(() => {
                  const pct = chartData.plannedKg ? Math.round((chartData.actualKg / Math.max(1, chartData.plannedKg)) * 100) : 0;
                  return <DonutChart value={pct} size={140} strokeWidth={12} color={pct >= 100 ? '#10b981' : pct >= 80 ? '#f59e0b' : '#ef4444'} label="Cumplimiento Total (Volumen)" />;
                })()}
              </div>
              
              {/* Bar Groups */}
              <div className="flex-1 grid grid-cols-3 gap-3 w-full">
                <BarGroup label="Series" planned={chartData.plannedSeries} actual={chartData.actualSeries} color="#3b82f6" />
                <BarGroup label="Reps" planned={chartData.plannedReps} actual={chartData.actualReps} color="#8b5cf6" />
                <BarGroup label="Volumen (kg)" planned={Math.round(chartData.plannedKg)} actual={Math.round(chartData.actualKg)} color="#f59e0b" />
              </div>
            </div>

            <div className="text-center text-xs text-slate-500 italic">
              * Comparativa basada en lo planificado vs lo registrado en sesiones.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
