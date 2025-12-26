import { ClientList } from "@/features/user-management/components/ClientList";

export const TrainerDashboard = () => {
  return (
    <div className="space-y-8">
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard del Entrenador</h1>
            <p className="text-muted-foreground">
                Gestiona tus clientes y planifica sus rutinas.
            </p>
        </div>
        <ClientList />
    </div>
  );
};