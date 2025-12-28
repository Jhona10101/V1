import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/user.store';
import { getAssignedClients } from '@/services/api/firestore';
import { Client } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const CoachDashboard = () => {
  const { user } = useUserStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      getAssignedClients(user.uid)
        .then(setClients)
        .finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">Mis Atletas</h1>
          <p className="text-slate-400 mt-1">Gestiona el progreso de tus alumnos asignados.</p>
        </div>
        <Button variant="outline">Nuevo Alumno</Button>
      </div>

      {loading ? (
        <div className="text-slate-500">Cargando atletas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Card key={client.uid} className="group cursor-pointer hover:border-blue-500/50">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-300">
                  {client.firstName[0]}{client.lastName[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{client.firstName} {client.lastName}</h3>
                  <p className="text-xs text-slate-500">Última act: Hoy</p>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="secondary" className="w-full text-xs py-2">Ver Ficha</Button>
              </div>
            </Card>
          ))}
          {clients.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
              No tienes alumnos asignados todavía.
            </div>
          )}
        </div>
      )}
    </div>
  );
};