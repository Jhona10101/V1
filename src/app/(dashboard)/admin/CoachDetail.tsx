import { useState, useEffect } from 'react';
import { Coach, Client } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, User, Users, Save, Edit2, X, CheckCircle, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { updateUser, getAllUsers, assignClientToCoach, removeClientFromCoach } from '@/services/api/firestore';

interface CoachDetailProps {
  coach: Coach;
  onBack: () => void;
  onUpdate?: () => void;
}

type TabType = 'personal' | 'clients';

export const CoachDetail = ({ coach, onBack, onUpdate }: CoachDetailProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Datos del Coach
  const [coachData, setCoachData] = useState(coach);
  
  // Gestión de Clientes
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [selectedClientToAdd, setSelectedClientToAdd] = useState('');

  // Cargar lista de todos los clientes para poder asignar/ver nombres
  const fetchClients = async () => {
    const users = await getAllUsers();
    const clients = users.filter(u => u.role === 'client') as Client[];
    setAllClients(clients);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Clientes asignados a este coach
  const assignedClients = allClients.filter(c => c.assignedCoachId === coach.uid);
  // Clientes disponibles (sin coach asignado)
  const availableClients = allClients.filter(c => !c.assignedCoachId);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSavePersonal = async () => {
    setLoading(true);
    try {
      await updateUser(coach.uid, coachData);
      setIsEditing(false);
      if (onUpdate) onUpdate();
      showNotification('success', 'Datos del entrenador actualizados.');
    } catch (error) {
      showNotification('error', 'Error al actualizar datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClient = async () => {
    if (!selectedClientToAdd) return;
    setLoading(true);
    try {
      await assignClientToCoach(coach.uid, selectedClientToAdd);
      await fetchClients(); // Recargar listas
      if (onUpdate) onUpdate();
      setSelectedClientToAdd('');
      showNotification('success', 'Atleta asignado correctamente.');
    } catch (error) {
      showNotification('error', 'Error al asignar atleta.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveClient = async (clientId: string) => {
    if (!confirm('¿Estás seguro de desvincular a este atleta?')) return;
    setLoading(true);
    try {
      await removeClientFromCoach(coach.uid, clientId);
      await fetchClients(); // Recargar listas
      if (onUpdate) onUpdate();
      showNotification('success', 'Atleta desvinculado.');
    } catch (error) {
      showNotification('error', 'Error al desvincular atleta.');
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{coach.firstName} {coach.lastName}</h1>
            <p className="text-slate-400 text-sm">Entrenador / Staff</p>
          </div>
        </div>
        
        {activeTab === 'personal' && (
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading}><X className="w-4 h-4 mr-2" /> Cancelar</Button>
                <Button onClick={handleSavePersonal} disabled={loading} className="bg-emerald-500 hover:bg-emerald-400 text-black">
                  {loading ? 'Guardando...' : <><Save className="w-4 h-4 mr-2" /> Guardar</>}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}><Edit2 className="w-4 h-4 mr-2" /> Editar Datos</Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        <TabButton id="personal" label="Datos Personales" icon={User} />
        <TabButton id="clients" label="Gestión de Atletas" icon={Users} />
      </div>

      <Card className="bg-slate-900/50 border-slate-800 min-h-[400px]">
        {/* TAB: DATOS PERSONALES */}
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Nombre</label>
              <input disabled={!isEditing} value={coachData.firstName} onChange={(e) => setCoachData({...coachData, firstName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white disabled:opacity-50 focus:border-emerald-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Apellido</label>
              <input disabled={!isEditing} value={coachData.lastName} onChange={(e) => setCoachData({...coachData, lastName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-white disabled:opacity-50 focus:border-emerald-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
              <input disabled value={coachData.email} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-slate-400 opacity-50 cursor-not-allowed" />
            </div>
          </div>
        )}

        {/* TAB: GESTIÓN DE CLIENTES */}
        {activeTab === 'clients' && (
          <div className="space-y-8">
            {/* Asignar Nuevo Cliente */}
            <div className="bg-slate-950/50 p-6 rounded-xl border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-emerald-500" /> Asignar Nuevo Atleta</h3>
              <div className="flex gap-4">
                <select 
                  value={selectedClientToAdd}
                  onChange={(e) => setSelectedClientToAdd(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 outline-none"
                >
                  <option value="">Seleccionar atleta disponible...</option>
                  {availableClients.map(c => (
                    <option key={c.uid} value={c.uid}>{c.firstName} {c.lastName} ({c.email})</option>
                  ))}
                </select>
                <Button onClick={handleAssignClient} disabled={!selectedClientToAdd || loading} className="bg-emerald-600 hover:bg-emerald-500">Asignar</Button>
              </div>
            </div>

            {/* Lista de Clientes Asignados */}
            <div>
              <h3 className="text-sm font-bold text-white mb-4">Atletas Asignados ({assignedClients.length})</h3>
              <div className="grid grid-cols-1 gap-3">
                {assignedClients.map(client => (
                  <div key={client.uid} className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-900/20 flex items-center justify-center text-blue-400 font-bold text-sm border border-blue-500/20">
                        {client.firstName[0]}{client.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-white">{client.firstName} {client.lastName}</p>
                        <p className="text-xs text-slate-500">{client.email}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveClient(client.uid)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Desvincular atleta"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {assignedClients.length === 0 && (
                  <p className="text-slate-500 text-sm italic text-center py-8">Este entrenador no tiene atletas asignados.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Notificación Toast */}
      {notification && (
        <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 z-50 ${notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100' : 'bg-red-950/90 border-red-500/30 text-red-100'}`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          <span className="font-medium text-sm tracking-wide">{notification.message}</span>
        </div>
      )}
    </div>
  );
};