import { AntropometriaForm } from "@/features/anthropometry/components/AntropometriaForm";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const DashboardPage = () => {
  return (
    <div className="space-y-8">
        <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard de Administrador</h1>
            <p className="text-muted-foreground">
                Métricas globales y acceso rápido a las funcionalidades.
            </p>
        </div>
        
        {/* Ejemplo de integración del formulario que ya creamos */}
        <Card>
            <CardHeader>
                <CardTitle>Simulador de Cálculo Antropométrico</CardTitle>
                <CardDescription>
                    Este es el componente de "Inteligencia Activa" que diseñamos. Pruébalo en tiempo real.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <AntropometriaForm />
            </CardContent>
        </Card>

        {/* Aquí irían más componentes: gráficos de métricas, listas de tareas, etc. */}
    </div>
  );
}