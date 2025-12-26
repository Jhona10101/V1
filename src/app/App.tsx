import { useAuthListener } from "@/hooks/useAuthListener";
import { useUserStore } from "@/store/user.store";
import { AppRouter } from "./Router"; // Importamos nuestro router

const SplashScreen = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
    <div className="text-2xl font-bold tracking-tighter">GYM ULTRA</div>
  </div>
);

function App() {
  // El hook inicializa la escucha de estado de autenticación
  useAuthListener();
  
  const { isLoading } = useUserStore();

  // Mientras se verifica el estado de auth con Firebase, mostramos un splash screen.
  // Esto previene un parpadeo de la pantalla de login antes de ser redirigido.
  if (isLoading) {
    return <SplashScreen />;
  }
  
  // Una vez que la carga inicial termina, el Router se encarga de todo.
  return <AppRouter />;
}

export default App;