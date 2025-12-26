import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom";
import { useUserStore } from "@/store/user.store";

// --- Páginas ---
import { LoginPage } from "@/app/(auth)/LoginPage";
import { DashboardLayout } from "@/app/(dashboard)/_layout/DashboardLayout";
import { DashboardPage } from "@/app/(dashboard)/DashboardPage";
// Placeholder para otras páginas
const ClientsPage = () => <div>Gestión de Clientes</div>; 

/**
 * Componente de Ruta Protegida:
 * - Si el usuario está autenticado, renderiza el contenido de la ruta (a través de <Outlet />).
 * - Si no, lo redirige a la página de login.
 */
const ProtectedRoute = () => {
  const { user } = useUserStore();
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};


const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute />, // El layout y sus hijos están protegidos
    children: [
        {
            element: <DashboardLayout />, // Layout con sidebar/header
            children: [
                {
                    index: true, // Ruta /dashboard
                    element: <DashboardPage />,
                },
                {
                    path: "clients", // Ruta /dashboard/clients
                    element: <ClientsPage />,
                }
                // ... aquí irían más rutas del dashboard
            ]
        }
    ],
  },
]);

export const AppRouter = () => {
    return <RouterProvider router={router} />;
}