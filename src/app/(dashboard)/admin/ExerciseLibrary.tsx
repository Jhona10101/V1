import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Search, Plus, Edit2, Trash2, Wrench, Dumbbell, Save, X, Filter, AlertTriangle, CheckCircle, Calendar, Info, ChevronLeft, ChevronRight } from 'lucide-react';

// Tipo de dato para Ejercicio/Máquina
export interface ExerciseMachine {
  id: string;
  title: string;
  muscleGroup: string;
  machineName: string;
  maintenanceLast: string; // ISO Date
  maintenanceNext: string; // ISO Date
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
}

// Datos iniciales simulados (Base de Datos de Máquinas y Ejercicios)
export const MOCK_EXERCISE_DB: ExerciseMachine[] = [
  { id: '1', title: 'Prensa de Piernas 45°', muscleGroup: 'Piernas', machineName: 'Leg Press TechGym', maintenanceLast: '2023-11-01', maintenanceNext: '2024-05-01', defaultSets: 4, defaultReps: 12, defaultWeight: 120 },
  { id: '2', title: 'Press de Banca Plano', muscleGroup: 'Pecho', machineName: 'Banco Olímpico', maintenanceLast: '2024-01-15', maintenanceNext: '2024-07-15', defaultSets: 4, defaultReps: 10, defaultWeight: 60 },
  { id: '3', title: 'Jalón al Pecho', muscleGroup: 'Espalda', machineName: 'Lat Pulldown Cable', maintenanceLast: '2023-12-10', maintenanceNext: '2024-06-10', defaultSets: 3, defaultReps: 12, defaultWeight: 45 },
  { id: '4', title: 'Extensiones de Cuádriceps', muscleGroup: 'Piernas', machineName: 'Leg Extension Machine', maintenanceLast: '2024-02-01', maintenanceNext: '2024-08-01', defaultSets: 3, defaultReps: 15, defaultWeight: 35 },
  { id: '5', title: 'Press Militar Sentado', muscleGroup: 'Hombros', machineName: 'Smith Machine', maintenanceLast: '2023-10-20', maintenanceNext: '2024-04-20', defaultSets: 3, defaultReps: 12, defaultWeight: 40 },
  { id: '6', title: 'Peso Muerto Rumano', muscleGroup: 'Piernas', machineName: 'Barra Olímpica + Platform', maintenanceLast: '2024-01-01', maintenanceNext: '2024-06-01', defaultSets: 3, defaultReps: 10, defaultWeight: 80 },
];

interface ExerciseLibraryProps {
  onBack: () => void;
}

export const ExerciseLibrary = ({ onBack }: ExerciseLibraryProps) => {
  const [exercises, setExercises] = useState<ExerciseMachine[]>(MOCK_EXERCISE_DB);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Partial<ExerciseMachine>>({});
  
  // Estado para el Calendario Dinámico
  const [calendarField, setCalendarField] = useState<'maintenanceLast' | 'maintenanceNext' | null>(null);
  const [viewDate, setViewDate] = useState(new Date());

  // Sugerencias por grupo muscular
  const suggestions: Record<string, string[]> = {
    'Piernas': ['Sentadilla Hack', 'Curl Femoral', 'Abductores', 'Gemelos en Máquina'],
    'Pecho': ['Press Inclinado', 'Aperturas (Peck Deck)', 'Cruce de Poleas'],
    'Espalda': ['Remo en Máquina', 'Remo Gironda', 'Pull Over'],
    'Hombros': ['Elevaciones Laterales', 'Pájaros', 'Press de Hombros'],
    'Brazos': ['Curl de Bíceps', 'Extensiones de Tríceps', 'Predicador'],
  };

  const handleSave = () => {
    if (currentExercise.id) {
      setExercises(exercises.map(e => e.id === currentExercise.id ? currentExercise as ExerciseMachine : e));
    } else {
      const newExercise = { ...currentExercise, id: Date.now().toString() } as ExerciseMachine;
      setExercises([...exercises, newExercise]);
    }
    setIsEditing(false);
    setCurrentExercise({});
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este ejercicio de la base de datos?')) {
      setExercises(exercises.filter(e => e.id !== id));
    }
  };

  const getMaintenanceStatus = (nextDate: string) => {
    const today = new Date();
    const next = new Date(nextDate);
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: 'text-red-500', bg: 'bg-red-500/10', text: 'Vencido', icon: AlertTriangle };
    if (diffDays < 30) return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', text: 'Próximo', icon: Wrench };
    return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', text: 'OK', icon: CheckCircle };
  };

  const filteredExercises = exercises.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.machineName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Funciones del Calendario
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  
  const handleDayClick = (day: number) => {
    if (!calendarField) return;
    // Crear fecha en local para evitar problemas de zona horaria con ISOString
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${d}`;
    
    setCurrentExercise({ ...currentExercise, [calendarField]: dateStr });
    setCalendarField(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Biblioteca de Ejercicios y Máquinas</h1>
            <p className="text-slate-400 text-sm">Gestión de inventario y mantenimiento.</p>
          </div>
        </div>
        <button 
          onClick={() => { setCurrentExercise({ muscleGroup: 'Piernas', defaultSets: 4, defaultReps: 12, defaultWeight: 0 }); setIsEditing(true); }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" /> Nuevo Ejercicio
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input 
          type="text" 
          placeholder="Buscar por nombre de ejercicio o máquina..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Modal de Calendario Dinámico */}
      {calendarField && (
        <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <Card className="w-full max-w-sm bg-slate-900 border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><ChevronLeft className="w-5 h-5" /></button>
              <span className="font-bold text-white text-lg capitalize">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
              <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><ChevronRight className="w-5 h-5" /></button>
            </div>
            
            <div className="grid grid-cols-7 gap-2 text-center mb-2">
              {['D','L','M','M','J','V','S'].map(d => <span key={d} className="text-xs font-bold text-slate-500">{d}</span>)}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {Array(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay()).fill(null).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(day => {
                const isSelected = currentExercise[calendarField] === `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = new Date().toDateString() === new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toDateString();
                
                return (
                  <button 
                    key={day} 
                    onClick={() => handleDayClick(day)}
                    className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      isSelected ? 'bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20' : 
                      isToday ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30' : 
                      'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setCalendarField(null)} className="mt-6 w-full py-2 text-slate-400 hover:text-white text-sm">Cancelar</button>
          </Card>
        </div>
      )}

      {/* Modal de Edición/Creación */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{currentExercise.id ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}</h2>
              <button onClick={() => setIsEditing(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Grupo Muscular</label>
                <select 
                  value={currentExercise.muscleGroup}
                  onChange={(e) => setCurrentExercise({...currentExercise, muscleGroup: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                >
                  {Object.keys(suggestions).map(g => <option key={g} value={g}>{g}</option>)}
                  <option value="Cardio">Cardio</option>
                  <option value="Full Body">Full Body</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Título del Ejercicio</label>
                <input 
                  value={currentExercise.title || ''}
                  onChange={(e) => setCurrentExercise({...currentExercise, title: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                  placeholder="Ej: Prensa de Piernas"
                />
                {currentExercise.muscleGroup && suggestions[currentExercise.muscleGroup] && (
                  <p className="text-[10px] text-slate-500">Sugerencias: {suggestions[currentExercise.muscleGroup].join(', ')}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Máquina / Implemento Requerido</label>
                <input 
                  value={currentExercise.machineName || ''}
                  onChange={(e) => setCurrentExercise({...currentExercise, machineName: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-emerald-500 outline-none"
                  placeholder="Ej: Máquina TechGym #04"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Último Mantenimiento</label>
                <button 
                  onClick={() => { setCalendarField('maintenanceLast'); setViewDate(currentExercise.maintenanceLast ? new Date(currentExercise.maintenanceLast + 'T12:00:00') : new Date()); }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-left flex items-center justify-between hover:border-emerald-500 transition-colors group"
                >
                  <span className={!currentExercise.maintenanceLast ? 'text-slate-500' : ''}>{currentExercise.maintenanceLast || 'Seleccionar fecha'}</span>
                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-emerald-500 transition-colors" />
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Próximo Mantenimiento</label>
                <button 
                  onClick={() => { setCalendarField('maintenanceNext'); setViewDate(currentExercise.maintenanceNext ? new Date(currentExercise.maintenanceNext + 'T12:00:00') : new Date()); }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-left flex items-center justify-between hover:border-emerald-500 transition-colors group"
                >
                  <span className={!currentExercise.maintenanceNext ? 'text-slate-500' : ''}>{currentExercise.maintenanceNext || 'Seleccionar fecha'}</span>
                  <Calendar className="w-4 h-4 text-slate-500 group-hover:text-emerald-500 transition-colors" />
                </button>
              </div>

              <div className="space-y-2 md:col-span-2 border-t border-slate-800 pt-4">
                <p className="text-sm font-bold text-white mb-2">Valores Predeterminados (Plantilla)</p>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-[10px] text-slate-500 uppercase">Series</label><input type="number" value={currentExercise.defaultSets} onChange={(e) => setCurrentExercise({...currentExercise, defaultSets: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white" /></div>
                  <div><label className="text-[10px] text-slate-500 uppercase">Reps</label><input type="number" value={currentExercise.defaultReps} onChange={(e) => setCurrentExercise({...currentExercise, defaultReps: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white" /></div>
                  <div><label className="text-[10px] text-slate-500 uppercase">Peso (kg)</label><input type="number" value={currentExercise.defaultWeight} onChange={(e) => setCurrentExercise({...currentExercise, defaultWeight: parseInt(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white" /></div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-400 hover:text-white">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-2">
                <Save className="w-4 h-4" /> Guardar
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Lista de Ejercicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map(ex => {
          const status = getMaintenanceStatus(ex.maintenanceNext);
          const StatusIcon = status.icon;
          return (
            <Card key={ex.id} className="group hover:border-emerald-500/30 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-slate-800 rounded-lg text-emerald-500">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${status.bg} ${status.color}`}>
                  <StatusIcon className="w-3 h-3" /> {status.text}
                </div>
              </div>
              
              <h3 className="font-bold text-white text-lg truncate">{ex.title}</h3>
              <p className="text-sm text-slate-400 mb-4">{ex.machineName}</p>
              
              <div className="space-y-2 text-xs text-slate-500 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between">
                  <span>Grupo:</span> <span className="text-white">{ex.muscleGroup}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mantenimiento:</span> <span className="text-white">{ex.maintenanceNext}</span>
                </div>
                <div className="flex justify-between">
                  <span>Plantilla:</span> <span className="text-white">{ex.defaultSets}x{ex.defaultReps} @ {ex.defaultWeight}kg</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800">
                <button 
                  onClick={() => { setCurrentExercise(ex); setIsEditing(true); }}
                  className="flex-1 py-2 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-400 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-3 h-3" /> Editar
                </button>
                <button 
                  onClick={() => handleDelete(ex.id)}
                  className="p-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};