import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { getAllUsers } from '@/services/api/firestore';
import { Client, Coach, Admin } from '@/types';
import { Users, Dumbbell, Search, CalendarPlus, ArrowLeft, FileText, User, Mail, Shield, TrendingUp } from 'lucide-react';
// Importamos ClientDetail desde la carpeta de admin (asumiendo estructura)
import { ClientDetail } from '../admin/ClientDetail';
import { ClientTrainingProgress } from './ClientTrainingProgress';

export const CoachDashboard = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [allUsers, setAllUsers] = useState<(Admin | Coach | Client)[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para el coach actual (Simulación de Auth)
  const [currentCoach, setCurrentCoach] = useState<Coach | null>(null);

  // Estados de navegación
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'menu' | 'sheet' | 'plan' | 'tracking'>('menu');

  const fetchData = async () => {
    const users = await getAllUsers();
    setAllUsers(users);
    
    // ---------------------------------------------------------------------------
    // SIMULACIÓN DE LOGIN: Tomamos el primer coach que encontremos en la BD
    // ---------------------------------------------------------------------------
    const foundCoach = users.find(u => u.role === 'coach') as Coach;
    setCurrentCoach(foundCoach || null);

    // Filtramos los clientes. Si encontramos un coach, buscamos SUS clientes.
    // Si no, mostramos todos los clientes (modo debug/demo) para que veas la UI.
    const myClients = foundCoach 
      ? (users.filter(u => u.role === 'client' && u.assignedCoachId === foundCoach.uid) as Client[])
      : (users.filter(u => u.role === 'client') as Client[]);
    
    setClients(myClients);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Renderizado condicional de vistas
  if (selectedClient) {
    // VISTA 1: MENÚ INTERMEDIO (Datos Coach + Opciones)
    if (viewMode === 'menu') {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          {/* Header con botón de volver */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedClient(null)} 
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Gestión de Atleta</h1>
              <p className="text-slate-400 text-sm">Panel de control para {selectedClient.firstName} {selectedClient.lastName}</p>
            </div>
          </div>

          {/* Tarjeta de Datos del Entrenador (Contexto) */}
          <Card className="bg-emerald-950/20 border-emerald-500/20">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-full">
                <Shield className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-1">Entrenador Responsable</h3>
                <p className="text-white font-medium text-lg">{currentCoach ? `${currentCoach.firstName} ${currentCoach.lastName}` : 'Vista de Administrador / Demo'}</p>
                <p className="text-slate-400 text-sm flex items-center gap-2 mt-1">
                  <Mail className="w-3 h-3" /> {currentCoach?.email || 'email@ejemplo.com'}
                </p>
              </div>
            </div>
          </Card>

          {/* Opciones de Gestión */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Opción 1: Ver Ficha */}
            <button 
              onClick={() => setViewMode('sheet')}
              className="group p-6 bg-slate-900/50 border border-slate-800 hover:border-blue-500/50 hover:bg-blue-900/10 rounded-2xl transition-all text-left space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Ver Ficha Técnica</h3>
                <p className="text-sm text-slate-400 mt-1">Consulta los datos antropométricos, RM y tests físicos del atleta. (Solo lectura)</p>
              </div>
            </button>

            {/* Opción 2: Ver Progreso (Nuevo) */}
            <button 
              onClick={() => setViewMode('tracking')}
              className="group p-6 bg-slate-900/50 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-900/10 rounded-2xl transition-all text-left space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">Progreso y Feedback</h3>
                <p className="text-sm text-slate-400 mt-1">Revisa el cumplimiento de la rutina semanal y envía sugerencias.</p>
              </div>
            </button>

            {/* Opción 2: Diseñar Plan */}
            <button 
              onClick={() => setViewMode('plan')}
              className="group p-6 bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-900/10 rounded-2xl transition-all text-left space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarPlus className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">Diseñar Plan de Entrenamiento</h3>
                <p className="text-sm text-slate-400 mt-1">Crea o modifica la rutina semanal de ejercicios para este atleta.</p>
              </div>
            </button>
          </div>
        </div>
      );
    }

    // VISTA 2: FICHA TÉCNICA (Solo Lectura)
    if (viewMode === 'sheet') {
      return (
        <ClientDetail 
          client={selectedClient} 
          allUsers={allUsers}
          onBack={() => setViewMode('menu')} 
          readOnly={true}
        />
      );
    }

    // VISTA 4: SEGUIMIENTO / PROGRESO (Nuevo Módulo)
    if (viewMode === 'tracking') {
      return (
        <ClientTrainingProgress client={selectedClient} onBack={() => setViewMode('menu')} />
      );
    }

    // VISTA 3: DISEÑADOR DE PLAN (Placeholder)
    if (viewMode === 'plan') {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewMode('menu')} className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Diseñador de Rutinas</h1>
              <p className="text-slate-400 text-sm">Planificación para {selectedClient.firstName}</p>
            </div>
          </div>
          <Card className="p-12 flex flex-col items-center justify-center text-center space-y-4 border-dashed border-slate-700 bg-slate-900/30">
            <div className="p-4 bg-slate-800 rounded-full">
              <CalendarPlus className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">Módulo en Construcción</h3>
              <p className="text-slate-500 max-w-md mt-2">Aquí aparecerá el formulario para crear rutinas semanales, seleccionar ejercicios y definir series/repeticiones.</p>
            </div>
          </Card>
        </div>
      );
    }
  }

  const filteredClients = clients.filter(c => 
    c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Panel de Entrenador</h1>
          <p className="text-slate-400">
            {currentCoach ? `Bienvenido, ${currentCoach.firstName}. Aquí están tus atletas.` : 'Modo Demo: Mostrando todos los atletas.'}
          </p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar atleta..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Mis Atletas</h3>
              <p className="text-3xl font-bold text-white mt-2">{loading ? '-' : clients.length}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <Users className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-emerald-500" />
          Atletas Asignados
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map(client => (
            <Card 
              key={client.uid} 
              className="flex flex-col gap-4 hover:border-emerald-500/50 transition-all group"
            >
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setSelectedClient(client); setViewMode('menu'); }}>
                <div className="w-12 h-12 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400 font-bold text-lg border border-emerald-500/20">
                  {client.firstName[0]}{client.lastName[0]}
                </div>
                <div>
                  <h3 className="font-medium text-white group-hover:text-emerald-400 transition-colors">{client.firstName} {client.lastName}</h3>
                  <p className="text-xs text-slate-500">{client.email}</p>
                </div>
              </div>
              <button onClick={() => { setSelectedClient(client); setViewMode('menu'); }} className="w-full mt-2 py-2 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <CalendarPlus className="w-4 h-4" />
                Gestionar Atleta
              </button>
            </Card>
          ))}
          {filteredClients.length === 0 && !loading && (
            <p className="text-slate-500 text-sm italic col-span-full">
              {currentCoach 
                ? `El entrenador ${currentCoach.firstName} no tiene atletas asignados.` 
                : "No se encontraron atletas en el sistema."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};