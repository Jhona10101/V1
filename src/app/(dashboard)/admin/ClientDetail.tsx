import { useState, useEffect } from 'react';
import { Client, Admin, Coach } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, User, Activity, Dumbbell, Save, Edit2, X, CheckCircle, AlertCircle, ClipboardList, Ruler, Timer } from 'lucide-react';
import { updateUser, getClientSheet, saveClientSheet } from '@/services/api/firestore';
import { MOCK_EXERCISE_DB } from './ExerciseLibrary';

interface ClientDetailProps {
  client: Client;
  allUsers?: (Admin | Coach | Client)[];
  onBack: () => void;
  onUpdate?: () => void;
  readOnly?: boolean;
}

type TabType = 'personal' | 'anthropometry' | 'onerm' | 'physicalTests';

export const ClientDetail = ({ client, allUsers, onBack, onUpdate, readOnly = false }: ClientDetailProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Estados de datos
  const [personalData, setPersonalData] = useState(client);
  const [anthropometry, setAnthropometry] = useState<any>({});
  const [oneRm, setOneRm] = useState<any>({});
  const [physicalTests, setPhysicalTests] = useState<any>({});

  // Cargar datos al montar
  useEffect(() => {
    const loadSheets = async () => {
      const anthroData = await getClientSheet(client.uid, 'anthropometry');
      const rmData = await getClientSheet(client.uid, 'onerm');
      const testsData = await getClientSheet(client.uid, 'physicalTests');
      if (anthroData) setAnthropometry(anthroData);
      if (rmData) setOneRm(rmData);
      if (testsData) setPhysicalTests(testsData);
    };
    loadSheets();
  }, [client.uid]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (activeTab === 'personal') {
        await updateUser(client.uid, personalData);
      } else if (activeTab === 'anthropometry') {
        await saveClientSheet(client.uid, 'anthropometry', anthropometry);
      } else if (activeTab === 'onerm') {
        await saveClientSheet(client.uid, 'onerm', oneRm);
      } else if (activeTab === 'physicalTests') {
        await saveClientSheet(client.uid, 'physicalTests', physicalTests);
      }
      setIsEditing(false);
      if (onUpdate) onUpdate(); // Refrescar datos del padre
      setNotification({ type: 'success', message: 'Ficha guardada correctamente.' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Error guardando:", error);
      setNotification({ type: 'error', message: 'Error al guardar los cambios.' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: TabType; label: string; icon: any }) => (
    <button
      onClick={() => { setActiveTab(id); setIsEditing(false); }}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all font-medium text-sm ${
        activeTab === id 
          ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
          : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header de Navegación */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{client.firstName} {client.lastName}</h1>
            <p className="text-slate-400 text-sm">{client.email}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!readOnly ? (
            isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading}>
                  <X className="w-4 h-4 mr-2" /> Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading} className="bg-emerald-500 hover:bg-emerald-400 text-black">
                  {loading ? 'Guardando...' : <><Save className="w-4 h-4 mr-2" /> Guardar Cambios</>}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="w-4 h-4 mr-2" /> Editar Ficha
              </Button>
            )
          ) : (
            <div className="px-3 py-1 bg-slate-800 rounded-lg border border-slate-700 text-xs text-slate-400 font-medium flex items-center">
              Modo Lectura
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        <TabButton id="personal" label="Datos Personales" icon={User} />
        <TabButton id="anthropometry" label="Antropometría" icon={Activity} />
        <TabButton id="onerm" label="Ficha 1RM" icon={Dumbbell} />
        <TabButton id="physicalTests" label="Tests Físicos" icon={ClipboardList} />
      </div>

      {/* Contenido de las Fichas */}
      <Card className="bg-slate-900/50 border-slate-800 min-h-[400px]">
        
        {/* FICHA 1: DATOS PERSONALES */}
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Nombre</label>
              <input
                disabled={!isEditing}
                value={personalData.firstName}
                onChange={(e) => setPersonalData({...personalData, firstName: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Apellido</label>
              <input
                disabled={!isEditing}
                value={personalData.lastName}
                onChange={(e) => setPersonalData({...personalData, lastName: e.target.value})}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Email (Solo lectura)</label>
              <input
                disabled
                value={personalData.email}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-400 opacity-50 cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Coach Asignado</label>
              <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white flex items-center gap-2">
                {(() => {
                  if (!personalData.assignedCoachId) return <span className="text-yellow-500 text-sm">Sin asignar</span>;
                  const coach = allUsers?.find(u => u.uid === personalData.assignedCoachId);
                  if (coach) {
                    return <span className="text-emerald-400 font-medium">{coach.firstName} {coach.lastName} <span className="text-slate-500 text-xs ml-1">#{coach.uid.slice(0, 6)}</span></span>;
                  }
                  return <span className="text-slate-500 text-sm">ID: {personalData.assignedCoachId.slice(0, 8)}...</span>;
                })()}
              </div>
            </div>
          </div>
        )}

        {/* FICHA 2: ANTROPOMETRÍA */}
        {activeTab === 'anthropometry' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Peso (kg)</label>
                <input
                  type="number"
                  disabled={!isEditing}
                  value={anthropometry.weight || ''}
                  onChange={(e) => setAnthropometry({...anthropometry, weight: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white disabled:opacity-50 focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Altura (cm)</label>
                <input
                  type="number"
                  disabled={!isEditing}
                  value={anthropometry.height || ''}
                  onChange={(e) => setAnthropometry({...anthropometry, height: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white disabled:opacity-50 focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">% Grasa Corporal</label>
                <input
                  type="number"
                  disabled={!isEditing}
                  value={anthropometry.bodyFat || ''}
                  onChange={(e) => setAnthropometry({...anthropometry, bodyFat: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white disabled:opacity-50 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white mb-4 border-b border-slate-800 pb-2">Perímetros (cm)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Brazo', 'Pecho', 'Cintura', 'Cadera', 'Muslo', 'Pantorrilla'].map((part) => (
                  <div key={part} className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">{part}</label>
                    <input
                      type="number"
                      disabled={!isEditing}
                      value={anthropometry[`perimeter_${part.toLowerCase()}`] || ''}
                      onChange={(e) => setAnthropometry({...anthropometry, [`perimeter_${part.toLowerCase()}`]: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white disabled:opacity-50 focus:border-emerald-500 outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FICHA 3: 1RM (Máquinas) */}
        {activeTab === 'onerm' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Registro de Fuerza Máxima</h3>
              <span className="text-xs text-slate-500">Última actualización: {oneRm.updatedAt ? new Date(oneRm.updatedAt).toLocaleDateString() : 'Nunca'}</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {MOCK_EXERCISE_DB.map((exercise) => {
                return (
                  <div key={exercise.id} className="flex items-center gap-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                    <div className="p-3 bg-emerald-500/10 rounded-lg">
                      <Dumbbell className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{exercise.title}</p>
                      <p className="text-xs text-slate-500">{exercise.machineName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        disabled={!isEditing}
                        value={oneRm[exercise.id] || ''}
                        onChange={(e) => setOneRm({...oneRm, [exercise.id]: e.target.value})}
                        placeholder="0"
                        className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-right text-white font-mono disabled:opacity-50 focus:border-emerald-500 outline-none"
                      />
                      <span className="text-sm text-slate-400 font-bold">KG</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* FICHA 4: TESTS FÍSICOS */}
        {activeTab === 'physicalTests' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Composición Corporal */}
              <div className="space-y-4 p-4 bg-slate-950/30 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-blue-500" />
                  Composición Básica
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 uppercase font-bold">Peso (kg)</label>
                    <input type="number" disabled={!isEditing} value={physicalTests.weight || ''} onChange={(e) => setPhysicalTests({...physicalTests, weight: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none" placeholder="0.0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 uppercase font-bold">% Grasa</label>
                    <input type="number" disabled={!isEditing} value={physicalTests.bodyFat || ''} onChange={(e) => setPhysicalTests({...physicalTests, bodyFat: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none" placeholder="0.0" />
                  </div>
                </div>
              </div>

              {/* Resistencia Cardiovascular */}
              <div className="space-y-4 p-4 bg-slate-950/30 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-500" />
                  Cardiovascular
                </h3>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase font-bold">Test de Cooper (metros)</label>
                  <input type="number" disabled={!isEditing} value={physicalTests.cooperTest || ''} onChange={(e) => setPhysicalTests({...physicalTests, cooperTest: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-red-500 outline-none" placeholder="Distancia en 12 min" />
                </div>
              </div>

              {/* Fuerza */}
              <div className="space-y-4 md:col-span-2 p-4 bg-slate-950/30 rounded-xl border border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Timer className="w-4 h-4 text-purple-500" />
                  Tests de Fuerza (1RM Estimado)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['Sentadilla', 'Press Banca', 'Peso Muerto'].map((exercise) => (
                    <div key={exercise} className="space-y-1">
                      <label className="text-xs text-slate-500 uppercase font-bold">{exercise} (kg)</label>
                      <input type="number" disabled={!isEditing} value={physicalTests[exercise.toLowerCase().replace(' ', '')] || ''} onChange={(e) => setPhysicalTests({...physicalTests, [exercise.toLowerCase().replace(' ', '')]: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-purple-500 outline-none" placeholder="0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Notificación Flotante Estética */}
      {notification && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50 ${
          notification.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100' 
            : 'bg-red-950/90 border-red-500/30 text-red-100'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          <span className="font-medium text-sm tracking-wide">{notification.message}</span>
        </div>
      )}
    </div>
  );
};