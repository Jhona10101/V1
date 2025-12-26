import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminDashboard = () => {
  return (
    <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard del Administrador</h1>
        <p className="text-muted-foreground">
            Vista global del rendimiento del gimnasio.
        </p>
        <Card>
            <CardHeader><CardTitle>Métricas Globales</CardTitle></CardHeader>
            <CardContent><p>(Aquí irían gráficos y KPIs)</p></CardContent>
        </Card>
    </div>
  );
};