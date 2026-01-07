import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { saveOneRmRecord, getOneRmForExercise, updateOneRmRecord } from '@/services/api/firestore';
import { OneRmCalculator } from './OneRmCalculator';
import { Dumbbell, Eye, CheckCircle, AlertTriangle, Zap, Loader, Search, Filter, TrendingUp } from 'lucide-react';

interface OneRmSheetProps {
  clientId: string;
}

export const OneRmSheet = ({ clientId }: OneRmSheetProps) => {
  const [strengthExercises, setStrengthExercises] = useState<any[]>([]);
  const [oneRmRecords, setOneRmRecords] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [manualInput, setManualInput] = useState<{ [key: string]: string }>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const exercisesRef = collection(db, 'exercises');
        const q = query(exercisesRef, where('type', '==', 'strength'));
        const snapshot = await getDocs(q);
        
        const exercises = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...(doc.data() as any)
          }))
          .sort((a: any, b: any) => (a.title || '').localeCompare(b.title || ''));
        
        setStrengthExercises(exercises);
        
        const groups = Array.from(new Set(exercises.map((e: any) => e.muscleGroup).filter(Boolean)));
        setMuscleGroups(groups as string[]);
        
        const records: { [key: string]: any } = {};
        for (const ex of exercises) {
          const record = await getOneRmForExercise(clientId, ex.id);
          if (record) {
            records[ex.id] = record;
          }
        }
        setOneRmRecords(records);
      } catch (error) {
        console.error('Error loading exercises:', error);
        setNotification({ type: 'error', message: 'Error cargando ejercicios' });
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, [clientId]);

  const handleCalculatorConfirm = async (oneRmKg: number, weightUsed: number, reps: number, calculations: any) => {
    if (!selectedExercise) return;

    setSavingId(selectedExercise.id);
    try {
      const existingRecord = oneRmRecords[selectedExercise.id];

      const recordData = {
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.title,
        oneRmKg,
        method: 'calculated',
        weightUsedKg: weightUsed,
        repsPerformed: reps,
        calculations,
        calculationDate: new Date().toISOString()
      };

      if (existingRecord) {
        await updateOneRmRecord(clientId, existingRecord.id, recordData);
        setOneRmRecords({
          ...oneRmRecords,
          [selectedExercise.id]: { id: existingRecord.id, ...recordData }
        });
      } else {
        const id = await saveOneRmRecord(clientId, recordData);
        setOneRmRecords({
          ...oneRmRecords,
          [selectedExercise.id]: { id, ...recordData }
        });
      }

      setNotification({ type: 'success', message: `1RM guardado: ${oneRmKg} kg` });
      setShowCalculator(false);
      setSelectedExercise(null);
    } catch (error) {
      console.error('Error saving 1RM:', error);
      setNotification({ type: 'error', message: 'Error guardando 1RM' });
    } finally {
      setSavingId(null);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleManualInput = async (exerciseId: string) => {
    const value = manualInput[exerciseId];
    if (!value || isNaN(parseFloat(value))) {
      setNotification({ type: 'error', message: 'Ingresa un valor válido' });
      return;
    }

    const oneRmKg = parseFloat(value);
    setSavingId(exerciseId);

    try {
      const exercise = strengthExercises.find(e => e.id === exerciseId);
      const existingRecord = oneRmRecords[exerciseId];

      const recordData = {
        exerciseId,
        exerciseName: exercise.title,
        oneRmKg,
        method: 'manual',
        calculationDate: new Date().toISOString()
      };

      if (existingRecord) {
        await updateOneRmRecord(clientId, existingRecord.id, recordData);
        setOneRmRecords({
          ...oneRmRecords,
          [exerciseId]: { id: existingRecord.id, ...recordData }
        });
      } else {
        const id = await saveOneRmRecord(clientId, recordData);
        setOneRmRecords({
          ...oneRmRecords,
          [exerciseId]: { id, ...recordData }
        });
      }

      setManualInput({ ...manualInput, [exerciseId]: '' });
      setNotification({ type: 'success', message: `1RM guardado: ${oneRmKg} kg` });
    } catch (error) {
      console.error('Error saving 1RM:', error);
      setNotification({ type: 'error', message: 'Error guardando 1RM' });
    } finally {
      setSavingId(null);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const filteredExercises = strengthExercises.filter((ex: any) => {
    const matchesSearch = (ex.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ex.muscleGroup || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = !selectedMuscleGroup || ex.muscleGroup === selectedMuscleGroup;
    return matchesSearch && matchesGroup;
  });

  const groupedExercises = filteredExercises.reduce((acc: any, ex: any) => {
    const group = ex.muscleGroup || 'Otros';
    if (!acc[group]) acc[group] = [];
    acc[group].push(ex);
    return acc;
  }, {});

  const sortedGroups = Object.keys(groupedExercises).sort();
  const completedCount = Object.keys(oneRmRecords).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`px-4 py-3 rounded-lg border flex items-center gap-2 text-sm animate-in slide-in-from-bottom-4 ${
            notification.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300'
              : 'bg-red-950/50 border-red-500/30 text-red-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          {notification.message}
        </div>
      )}

      {strengthExercises.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-300 uppercase font-bold">Total Ejercicios</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">{strengthExercises.length}</p>
          </div>
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3 text-center">
            <p className="text-xs text-emerald-300 uppercase font-bold">1RM Registrados</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-center">
            <p className="text-xs text-slate-400 uppercase font-bold">Progreso</p>
            <p className="text-2xl font-bold text-white mt-1">
              {strengthExercises.length > 0 ? Math.round((completedCount / strengthExercises.length) * 100) : 0}%
            </p>
          </div>
        </div>
      )}

      {strengthExercises.length > 0 && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar ejercicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          {muscleGroups.length > 0 && (
            <div className="flex gap-2 flex-wrap items-center">
              <Filter className="w-4 h-4 text-slate-500" />
              <button
                onClick={() => setSelectedMuscleGroup(null)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                  selectedMuscleGroup === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Todos ({strengthExercises.length})
              </button>
              {muscleGroups.map((group: any) => (
                <button
                  key={group}
                  onClick={() => setSelectedMuscleGroup(group)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                    selectedMuscleGroup === group
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {group} ({strengthExercises.filter((e: any) => e.muscleGroup === group).length})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {strengthExercises.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center text-slate-400">
          <Dumbbell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No hay ejercicios de fuerza disponibles</p>
          <p className="text-xs mt-1">Crea ejercicios en la biblioteca primero</p>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center text-slate-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No se encontraron ejercicios</p>
          <p className="text-xs mt-1">Intenta con otro término de búsqueda o filtro</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedGroups.map((groupName: any) => (
            <div key={groupName}>
              <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-4 pl-3 border-l-4 border-blue-500 flex items-center gap-2">
                {groupName}
                <span className="text-xs font-normal bg-slate-800 px-2 py-1 rounded text-slate-400">
                  {groupedExercises[groupName].length}
                </span>
              </h4>

              <div className="space-y-3">
                {groupedExercises[groupName].map((exercise: any) => {
                  const record = oneRmRecords[exercise.id];
                  const isLoading = savingId === exercise.id;

                  return (
                    <Card key={exercise.id} className="group hover:border-blue-500/50 transition-all">
                      <div className="flex items-center gap-4 p-4">
                        <div className="flex-shrink-0">
                          {exercise.gifUrl ? (
                            <button
                              onClick={() => window.open(exercise.gifUrl, '_blank')}
                              className="relative group/img w-20 h-20 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 group-hover/img:border-blue-500/50 transition-all"
                            >
                              <img
                                src={exercise.gifUrl}
                                alt={exercise.title}
                                className="w-full h-full object-cover opacity-70 group-hover/img:opacity-100 transition-opacity"
                              />
                              <Eye className="w-5 h-5 absolute inset-0 m-auto text-blue-400 opacity-0 group-hover/img:opacity-100 transition-opacity" />
                            </button>
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                              <Dumbbell className="w-8 h-8 text-slate-600" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-base truncate">{exercise.title}</h3>
                          <div className="flex gap-3 text-xs text-slate-400 mt-2 flex-wrap">
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <Dumbbell className="w-3 h-3" />
                              {exercise.muscleGroup}
                            </span>
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <Zap className="w-3 h-3" />
                              {exercise.defaultSets}x{exercise.defaultReps}
                            </span>
                            <span className="text-slate-500 whitespace-nowrap">
                              @ {exercise.defaultWeight}kg
                            </span>
                          </div>
                        </div>

                        {record ? (
                          <div className="text-right flex-shrink-0">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                              <p className="text-xs text-slate-400">1RM</p>
                            </div>
                            <p className="text-3xl font-bold text-emerald-400">{record.oneRmKg}</p>
                            <p className="text-xs text-slate-500 mt-1 text-right">
                              {record.method === 'calculated' ? 'Calculado' : 'Manual'}
                            </p>
                            <button
                              onClick={() => {
                                setSelectedExercise(exercise);
                                setShowCalculator(true);
                              }}
                              className="text-xs mt-2 text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Editar
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 flex-shrink-0 w-56">
                            <button
                              onClick={() => {
                                setSelectedExercise(exercise);
                                setShowCalculator(true);
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                            >
                              Calcular 1RM
                            </button>

                            <div className="flex gap-2">
                              <input
                                type="number"
                                placeholder="O escribe 1RM"
                                value={manualInput[exercise.id] || ''}
                                onChange={(e) =>
                                  setManualInput({ ...manualInput, [exercise.id]: e.target.value })
                                }
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleManualInput(exercise.id);
                                  }
                                }}
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-slate-600 outline-none transition-colors"
                              />
                              <button
                                onClick={() => handleManualInput(exercise.id)}
                                disabled={isLoading || !manualInput[exercise.id]}
                                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                {isLoading ? <Loader className="w-3 h-3 animate-spin" /> : 'Guardar'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCalculator && selectedExercise && (
        <OneRmCalculator
          exerciseName={selectedExercise.title}
          onCalculate={handleCalculatorConfirm}
          onClose={() => {
            setShowCalculator(false);
            setSelectedExercise(null);
          }}
          isLoading={savingId === selectedExercise.id}
        />
      )}
    </div>
  );
};
