import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { getAllUsers } from '@/services/api/firestore';
import { Admin, Coach, Client } from '@/types';
import { Users, Dumbbell, Search, Shield, Database, FileText, BarChart } from 'lucide-react';
import { ClientDetail } from './ClientDetail';
import { CoachDetail } from './CoachDetail';
import { ClientPhysicalTests } from './ClientPhysicalTests';
import { ExerciseLibrary } from './ExerciseLibrary';

export const AdminDashboard = () => {
  const [users, setUsers] = useState<(Admin | Coach | Client)[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [selectedClientForTests, setSelectedClientForTests] = useState<Client | null>(null);
  const [showExerciseLib, setShowExerciseLib] = useState(false);

  const fetchData = async () => {
    const data = await getAllUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Si hay un cliente seleccionado, mostramos su detalle
  if (selectedClient) {
    return <ClientDetail client={selectedClient} allUsers={users} onBack={() => setSelectedClient(null)} onUpdate={fetchData} />;
  }

  // Si hay un coach seleccionado, mostramos su detalle
  if (selectedCoach) {
    return <CoachDetail coach={selectedCoach} onBack={() => setSelectedCoach(null)} onUpdate={fetchData} />;
  }

  // Si hay un cliente seleccionado para tests físicos
  if (selectedClientForTests) {
    return <ClientPhysicalTests client={selectedClientForTests} onBack={() => setSelectedClientForTests(null)} />;
  }

  // Si se selecciona la biblioteca de ejercicios
  if (showExerciseLib) {
    return <ExerciseLibrary onBack={() => setShowExerciseLib(false)} />;
  }

  // Filtrado y Separación de Roles
  const filteredUsers = users.filter(u => 
    u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const coaches = filteredUsers.filter(u => u.role === 'coach') as Coach[];
  const clients = filteredUsers.filter(u => u.role === 'client') as Client[];
  const admins = filteredUsers.filter(u => u.role === 'admin');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Panel de Control</h1>
          <p className="text-slate-400">Gestión global de V-METRIQ.</p>
        </div>
        
        {/* Buscador Rápido */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar usuario..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* KPIs / Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Atletas Activos</h3>
              <p className="text-3xl font-bold text-white mt-2">{loading ? '-' : users.filter(u => u.role === 'client').length}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Staff (Coaches)</h3>
              <p className="text-3xl font-bold text-white mt-2">{loading ? '-' : users.filter(u => u.role === 'coach').length}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <Dumbbell className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Administradores</h3>
              <p className="text-3xl font-bold text-white mt-2">{loading ? '-' : admins.length}</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Shield className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: 2 Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* MÓDULO 1: STAFF DE ENTRENADORES */}
        <Card className="flex flex-col h-[500px] overflow-hidden p-0">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-emerald-500/10 rounded-lg"><Dumbbell className="w-5 h-5 text-emerald-500" /></div>
               <h2 className="text-lg font-bold text-white">Staff de Entrenadores</h2>
             </div>
             <span className="text-xs font-bold bg-slate-800 text-slate-400 px-3 py-1 rounded-full">{coaches.length} Activos</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
             {coaches.map(coach => (
               <div key={coach.uid} onClick={() => setSelectedCoach(coach)} className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/30 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800 transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20">
                    {coach.firstName[0]}{coach.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{coach.firstName} {coach.lastName}</h3>
                    <p className="text-xs text-slate-500">{coach.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-500">{coach.assignedClientIds?.length || 0}</span>
                    <p className="text-[10px] text-slate-500 uppercase">Atletas</p>
                  </div>
               </div>
             ))}
             {coaches.length === 0 && !loading && <div className="text-center text-slate-500 py-10 italic">No hay entrenadores registrados.</div>}
          </div>
        </Card>

        {/* MÓDULO 2: ATLETAS Y CLIENTES */}
        <Card className="flex flex-col h-[500px] overflow-hidden p-0">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-500/10 rounded-lg"><Users className="w-5 h-5 text-blue-500" /></div>
               <h2 className="text-lg font-bold text-white">Atletas y Clientes</h2>
             </div>
             <span className="text-xs font-bold bg-slate-800 text-slate-400 px-3 py-1 rounded-full">{clients.length} Activos</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
             {clients.map(client => (
               <div key={client.uid} onClick={() => setSelectedClient(client)} className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/30 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 transition-all cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                    {client.firstName[0]}{client.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{client.firstName} {client.lastName}</h3>
                    <p className="text-xs text-slate-500">{client.email}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-slate-500 uppercase">Coach</p>
                    <p className="text-xs text-slate-300">
                      {client.assignedCoachId ? (users.find(u => u.uid === client.assignedCoachId)?.firstName || '...') : <span className="text-yellow-500">Sin asignar</span>}
                    </p>
                  </div>
               </div>
             ))}
             {clients.length === 0 && !loading && <div className="text-center text-slate-500 py-10 italic">No hay atletas registrados.</div>}
          </div>
        </Card>

        {/* MÓDULO 3: BASE DE DATOS */}
        <Card onClick={() => setShowExerciseLib(true)} className="flex flex-col h-[200px] cursor-pointer group hover:border-slate-600 transition-all relative overflow-hidden p-0">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
             <Database className="w-32 h-32 text-slate-400" />
           </div>
           <div className="p-5 flex items-center gap-3 relative z-10">
             <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-white transition-colors"><Database className="w-5 h-5" /></div>
             <h2 className="text-lg font-bold text-white">Base de Datos</h2>
           </div>
           <div className="flex-1 flex items-center justify-center gap-6 px-6 pb-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg flex-shrink-0">
                <Database className="w-7 h-7 text-slate-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">Catálogo Maestro</h3>
                <p className="text-slate-400 text-xs mt-1">Administra ejercicios, máquinas y mantenimiento.</p>
              </div>
           </div>
        </Card>

        {/* MÓDULO 4: INFORMES (NUEVO) */}
        <Card className="flex flex-col h-[200px] cursor-pointer group hover:border-purple-500/50 transition-all relative overflow-hidden p-0">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
             <BarChart className="w-32 h-32 text-purple-500" />
           </div>
           <div className="p-5 flex items-center gap-3 relative z-10">
             <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><FileText className="w-5 h-5" /></div>
             <h2 className="text-lg font-bold text-white">Informes</h2>
           </div>
           <div className="flex-1 flex items-center justify-center gap-6 px-6 pb-4 relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-purple-900/20 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg flex-shrink-0">
                <BarChart className="w-7 h-7 text-purple-500" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">Reportes Generales</h3>
                <p className="text-slate-400 text-xs mt-1">Análisis de rendimiento y métricas.</p>
                <div className="mt-2 inline-block px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[9px] font-bold text-purple-400 uppercase tracking-wider">
                  Próximamente
                </div>
              </div>
           </div>
        </Card>

      </div>
    </div>
  );
};