import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export const ClientDashboard = () => {
  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-white">Hola, Atleta</h1>
        <p className="text-slate-400">Listo para romper tus límites hoy?</p>
      </header>

      {/* Tarjeta de Rutina Principal */}
      <Card className="bg-gradient-to-br from-blue-900/40 to-slate-900 border-blue-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22 14.86 20.57 16.29 22 18.43 19.86 19.86 21.29 21.29 19.86l-1.43-1.43L22 16.29l-1.43-1.43L19.14 16.29 20.57 14.86z"/></svg>
        </div>
        <h2 className="text-lg font-semibold text-blue-100 mb-1">Rutina de Hoy</h2>
        <p className="text-3xl font-bold text-white mb-4">Torso / Fuerza</p>
        <div className="flex items-center gap-4 text-sm text-blue-200/70 mb-6">
          <span>⏱ 60 min</span>
          <span>🔥 Intensidad Alta</span>
        </div>
        <Button className="w-full">Iniciar Entrenamiento</Button>
      </Card>

      {/* Accesos Rápidos */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center py-6 hover:bg-slate-800/80 cursor-pointer">
          <div className="text-2xl mb-2">📊</div>
          <h3 className="font-medium text-slate-200">Mi Progreso</h3>
        </Card>
        <Card className="text-center py-6 hover:bg-slate-800/80 cursor-pointer">
          <div className="text-2xl mb-2">⚖️</div>
          <h3 className="font-medium text-slate-200">1RM Histórico</h3>
        </Card>
      </div>

      {/* Cronómetro Flotante (Ejemplo UI) */}
      <div className="fixed bottom-6 left-4 right-4 bg-slate-900/90 backdrop-blur-lg border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-2xl">
        <span className="text-slate-400 text-sm">Descanso</span>
        <span className="font-mono text-xl font-bold text-emerald-400">00:00</span>
        <button className="bg-slate-800 p-2 rounded-lg text-slate-300">▶</button>
      </div>
    </div>
  );
};