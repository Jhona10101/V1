import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUserStore } from '@/store/user.store';
import { DashboardLayout } from './(dashboard)/_layout/DashboardLayout';
import { AdminDashboard } from './(dashboard)/admin/AdminDashboard';
import { CoachDashboard } from './(dashboard)/coach/CoachDashboard';
import { ClientDashboard } from './(dashboard)/client/ClientDashboard';

// Componentes temporales para probar la navegación
const Login = () => <div className="p-10"><h1>Página de Login</h1></div>;

export const AppRouter = () => {
  const { user } = useUserStore();

  // Función auxiliar para renderizar el dashboard correcto según el rol
  const getDashboardByRole = () => {
    if (!user) return <Navigate to="/login" />;
    
    switch (user.role) {
      case 'admin': return <AdminDashboard />;
      case 'coach': return <CoachDashboard />;
      case 'client': return <ClientDashboard />;
      default: return <div>Rol desconocido</div>;
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

        {/* Rutas Privadas (Dashboard) */}
        <Route path="/" element={
          user ? <DashboardLayout>{getDashboardByRole()}</DashboardLayout> : <Navigate to="/login" />
        } />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};