import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { saveOneRmRecord, getOneRmForExercise, updateOneRmRecord } from '@/services/api/firestore';
import { OneRmCalculator } from './OneRmCalculator';
import { Dumbbell, Eye, CheckCircle, AlertTriangle, Zap, Loader, Search, Filter } from 'lucide-react';

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
        
        // Primero intenta cargar con filter type='strength'
        let q = query(exercisesRef, where('type', '==', 'strength'));
        let snapshot = await getDocs(q);
        
        // Si no encuentra ejercicios con type='strength', carga todos
        if (snapshot.empty) {
          q = query(exercisesRef);
          snapshot = await getDocs(q);
        }
        
        // Filtra solo ejercicios de fuerza (descarta cardio si existen ambos tipos)
        const exercises = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...(doc.data() as any)
          }))
          .filter((ex: any) => {
            // Si tiene type, debe ser 'strength'. Si no tiene type, se incluye (compatible con ejercicios antiguos)
            return !ex.type || ex.type === 'strength';
          })
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
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-12 text-center text-slate-400 space-y-4">
          <div className="flex justify-center">
            <div className="bg-slate-700/50 rounded-full p-6">
              <Dumbbell className="w-12 h-12 mx-auto text-slate-500" />
            </div>
          </div>
          <div>
            <p className="font-bold text-lg text-slate-300">No hay ejercicios de fuerza disponibles</p>
            <p className="text-sm text-slate-500 mt-2">Primero debes crear ejercicios de fuerza en la biblioteca de ejercicios</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-left text-xs text-slate-400 space-y-2">
            <p className="font-bold text-slate-300">Pasos:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ve a <span className="text-blue-400 font-semibold">Biblioteca de Ejercicios</span></li>
              <li>Crea ejercicios con tipo <span className="text-blue-400 font-semibold">Fuerza</span></li>
              <li>Vuelve aquí para registrar sus 1RM</li>
            </ul>
          </div>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-xl p-12 text-center text-slate-400 space-y-4">
          <div className="flex justify-center">
            <div className="bg-slate-700/50 rounded-full p-6">
              <Search className="w-12 h-12 mx-auto text-slate-500" />
            </div>
          </div>
          <div>
            <p className="font-bold text-lg text-slate-300">No se encontraron ejercicios</p>
            <p className="text-sm text-slate-500 mt-2">Intenta con otro término de búsqueda o ajusta los filtros</p>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedGroups.map((groupName: any) => (
            <div key={groupName} className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <div className="flex-1">
                  <h4 className="text-base font-bold text-white uppercase tracking-wider">{groupName}</h4>
                  <div className="h-0.5 bg-gradient-to-r from-blue-500 to-blue-600 mt-2 rounded-full"></div>
                </div>
                <span className="inline-flex items-center justify-center bg-blue-600/30 border border-blue-500/50 text-blue-300 text-xs font-bold px-3 py-1.5 rounded-lg">
                  {groupedExercises[groupName].length} ejercicios
                </span>
              </div>

              <div className="space-y-3">
                {groupedExercises[groupName].map((exercise: any) => {
                  const record = oneRmRecords[exercise.id];
                  const isLoading = savingId === exercise.id;

                  return (
                    <Card key={exercise.id} className="group hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300">
                      <div className="flex items-center gap-4 p-4">
                        <div className="flex-shrink-0">
                          {exercise.gifUrl ? (
                            <button
                              onClick={() => window.open(exercise.gifUrl, '_blank')}
                              className="relative group/img w-20 h-20 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 group-hover/img:border-blue-500 transition-all duration-300 cursor-pointer"
                            >
                              <img
                                src={exercise.gifUrl}
                                alt={exercise.title}
                                className="w-full h-full object-cover opacity-70 group-hover/img:opacity-100 transition-opacity duration-300"
                              />
                              <div className="absolute inset-0 bg-black/20 group-hover/img:bg-black/0 transition-colors duration-300 flex items-center justify-center">
                                <Eye className="w-5 h-5 text-blue-400 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300" />
                              </div>
                            </button>
                          ) : (
                            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 group-hover/img:border-blue-500/50 flex items-center justify-center transition-all duration-300">
                              <Dumbbell className="w-8 h-8 text-slate-500" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-base truncate group-hover:text-blue-300 transition-colors">{exercise.title}</h3>
                          <div className="flex gap-3 text-xs text-slate-400 mt-2.5 flex-wrap">
                            <span className="flex items-center gap-1.5 whitespace-nowrap bg-slate-800/50 px-2 py-1 rounded">
                              <Dumbbell className="w-3 h-3 text-slate-500" />
                              {exercise.muscleGroup}
                            </span>
                            <span className="flex items-center gap-1.5 whitespace-nowrap bg-slate-800/50 px-2 py-1 rounded">
                              <Zap className="w-3 h-3 text-slate-500" />
                              {exercise.defaultSets}x{exercise.defaultReps}
                            </span>
                            <span className="text-slate-500 whitespace-nowrap bg-slate-800/50 px-2 py-1 rounded">
                              @ {exercise.defaultWeight}kg
                            </span>
                          </div>
                        </div>

                        {record ? (
                          <div className="text-right flex-shrink-0 space-y-2">
                            <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg p-3">
                              <p className="text-xs text-emerald-400 uppercase font-bold mb-1">1RM</p>
                              <p className="text-3xl font-bold text-emerald-300">{record.oneRmKg}kg</p>
                              <p className="text-xs text-emerald-600/80 mt-1.5">
                                {record.method === 'calculated' ? '📊 Calculado' : '✍️ Manual'}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedExercise(exercise);
                                setShowCalculator(true);
                              }}
                              className="w-full text-xs font-bold text-blue-400 hover:text-blue-300 hover:bg-slate-800/50 py-2 px-2 rounded transition-all duration-200"
                            >
                              Editar
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2 flex-shrink-0 w-60">
                            <button
                              onClick={() => {
                                setSelectedExercise(exercise);
                                setShowCalculator(true);
                              }}
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                              <span>📊</span> Calcular 1RM
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
                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:border-blue-500 outline-none transition-colors placeholder:text-slate-600"
                              />
                              <button
                                onClick={() => handleManualInput(exercise.id)}
                                disabled={isLoading || !manualInput[exercise.id]}
                                className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1"
                              >
                                {isLoading ? <Loader className="w-3 h-3 animate-spin" /> : '✓ Guardar'}
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
