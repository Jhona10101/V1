import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { getAllUsers } from '@/services/api/firestore';
import { Admin, Coach, Client } from '@/types';
import { Users, Dumbbell, TrendingUp, Search, UserCheck, Shield } from 'lucide-react';

export const AdminDashboard = () => {
  const [users, setUsers] = useState<(Admin | Coach | Client)[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllUsers();
      setUsers(data);
      setLoading(false);
    };
    fetchData();
  }, []);

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
    <div className="space-y-8">
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

      {/* Sección de Entrenadores */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-emerald-500" />
          Staff de Entrenadores
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map(coach => (
            <Card key={coach.uid} className="flex items-center gap-4 hover:border-emerald-500/50 cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400 font-bold text-lg border border-emerald-500/20">
                {coach.firstName[0]}{coach.lastName[0]}
              </div>
              <div>
                <h3 className="font-medium text-white group-hover:text-emerald-400 transition-colors">{coach.firstName} {coach.lastName}</h3>
                <p className="text-xs text-slate-500">{coach.email}</p>
                <p className="text-[10px] text-emerald-500 mt-1 uppercase tracking-wide font-bold">{coach.assignedClientIds?.length || 0} Atletas Asignados</p>
              </div>
            </Card>
          ))}
          {coaches.length === 0 && !loading && <p className="text-slate-500 text-sm italic col-span-full">No hay entrenadores registrados.</p>}
        </div>
      </div>

      {/* Sección de Clientes */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Atletas y Clientes
        </h2>
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-1 divide-y divide-slate-800">
            {clients.map(client => (
              <div key={client.uid} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 font-bold text-sm border border-blue-500/20">
                    {client.firstName[0]}{client.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">{client.firstName} {client.lastName}</h3>
                    <p className="text-xs text-slate-500">{client.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">Coach Asignado</p>
                    <p className="text-xs text-white font-medium">
                      {client.assignedCoachId ? 
                        (users.find(u => u.uid === client.assignedCoachId)?.firstName || 'Desconocido') 
                        : <span className="text-yellow-500">Sin asignar</span>
                      }
                    </p>
                  </div>
                  <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <TrendingUp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {clients.length === 0 && !loading && (
              <div className="p-8 text-center text-slate-500 text-sm">No se encontraron atletas.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};