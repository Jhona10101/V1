import { useUserStore } from "@/store/user.store";
import { AdminDashboard } from "./AdminDashboard";
import { TrainerDashboard } from "./TrainerDashboard";
import { ClientDashboard } from "./ClientDashboard";

const RenderDashboardByRole = () => {
  const { user } = useUserStore();

  switch (user?.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'trainer':
      return <TrainerDashboard />;
    case 'client':
      return <ClientDashboard />;
    default:
      // Muestra un estado de carga o error si el rol no es reconocido
      return <div>Verificando rol de usuario...</div>;
  }
};


export const DashboardPage = () => {
  return <RenderDashboardByRole />;
};