import { Card } from '@/components/ui/Card';

export const AdminDashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Panel de Control</h1>
        <p className="text-slate-400">Visión global del gimnasio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Usuarios Totales</h3>
          <p className="text-4xl font-bold text-white mt-2">1,240</p>
          <span className="text-emerald-400 text-sm">+12% este mes</span>
        </Card>
        <Card>
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Entrenadores Activos</h3>
          <p className="text-4xl font-bold text-white mt-2">8</p>
        </Card>
        <Card>
          <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">Ingresos Recurrentes</h3>
          <p className="text-4xl font-bold text-white mt-2">$12.4k</p>
        </Card>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-white mb-4">Gestión de Usuarios</h2>
        <Card className="min-h-[300px] flex items-center justify-center border-dashed border-slate-800 bg-transparent">
          <div className="text-center">
            <p className="text-slate-500 mb-4">Lista de usuarios y asignaciones</p>
            <button className="text-blue-400 hover:text-blue-300 text-sm">Cargar lista completa...</button>
          </div>
        </Card>
      </div>
    </div>
  );
};