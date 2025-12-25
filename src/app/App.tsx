import { useAuthListener } from "@/hooks/useAuthListener";
import { useUserStore } from "@/store/user.store";
import { useEffect } from "react";

// Placeholder para tus rutas y componentes
const AuthenticatedApp = () => <div>Dashboard del Gimnasio</div>;
const UnauthenticatedApp = () => <div>Página de Login</div>;
const SplashScreen = () => <div className="h-screen w-full flex items-center justify-center">Cargando...</div>

function App() {
  // Este hook personalizado se encargará de escuchar los cambios de auth
  // y actualizar nuestro store de Zustand.
  useAuthListener();
  
  const { user, isLoading } = useUserStore();

  if (isLoading) {
    return <SplashScreen />;
  }
  
  return user ? <AuthenticatedApp /> : <UnauthenticatedApp />;
}

export default App;