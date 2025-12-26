import { Outlet, Link, useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { useUserStore } from "@/store/user.store";
import { Button } from "@/components/ui/button";

export const DashboardLayout = () => {
  const { user } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    // La redirección es manejada por ProtectedRoute, pero podemos forzarla si es necesario.
    navigate('/'); 
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      {/* Barra de Navegación Lateral */}
      <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col gap-2 p-4">
            <h2 className="text-lg font-semibold tracking-tight">Gym Ultra</h2>
            <Link to="/dashboard" className="rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">Dashboard</Link>
            <Link to="/dashboard/clients" className="rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary">Clientes</Link>
        </nav>
      </aside>
      
      {/* Contenido Principal */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm">Bienvenido, {user?.firstName}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Cerrar Sesión
            </Button>
          </div>
        </header>
        
        <main className="flex-1 p-4 sm:px-6 sm:py-0">
            {/* Las páginas hijas (DashboardPage, ClientsPage, etc.) se renderizarán aquí */}
            <Outlet />
        </main>
      </div>
    </div>
  );
};