import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const ClientDashboard = () => {
  return (
    <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Mi Entrenamiento de Hoy</h1>
        <p className="text-muted-foreground">
            Modo Foco: concéntrate en tu rutina.
        </p>
        <Card className="bg-primary text-primary-foreground">
            <CardHeader><CardTitle>Modo Foco</CardTitle></CardHeader>
            <CardContent><p>(Aquí iría el cronómetro y la vista de ejercicios)</p></CardContent>
        </Card>
    </div>
  );
};