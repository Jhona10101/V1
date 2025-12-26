'use client';

import React, { useState, useEffect } from 'react';
import { useUserStore } from '@/store/user.store';
import { getAssignedClients } from '@/services/api/firestore';
import { Client } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Componente para mostrar un solo cliente en la lista
const ClientCard = ({ client }: { client: Client }) => (
    <div className="flex items-center justify-between space-x-4 rounded-md border p-4">
        <div className="flex items-center space-x-4">
            {/* Placeholder para un avatar */}
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div>
                <p className="text-sm font-medium leading-none">{client.firstName} {client.lastName}</p>
                <p className="text-sm text-muted-foreground">{client.email}</p>
            </div>
        </div>
        {/* Aquí podría ir un botón para "Ver Ficha" */}
    </div>
);


export const ClientList = () => {
  const { user } = useUserStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Nos aseguramos de que el usuario exista y sea un entrenador.
    if (user && user.role === 'trainer') {
      const fetchClients = async () => {
        setIsLoading(true);
        const assignedClients = await getAssignedClients(user.uid);
        setClients(assignedClients);
        setIsLoading(false);
      };

      fetchClients();
    }
  }, [user]);

  if (isLoading) {
    return <div>Cargando clientes...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mis Clientes Asignados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {clients.length > 0 ? (
          clients.map(client => <ClientCard key={client.uid} client={client} />)
        ) : (
          <p className="text-sm text-muted-foreground">No tienes clientes asignados en este momento.</p>
        )}
      </CardContent>
    </Card>
  );
};