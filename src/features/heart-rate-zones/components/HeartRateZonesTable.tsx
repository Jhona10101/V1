import { Card } from '@/components/ui/Card';
import { Activity, TrendingUp } from 'lucide-react';
import { HeartRateZone } from '../hooks/useHeartRateZones';

interface HeartRateZonesTableProps {
  zones: HeartRateZone[];
  fcMax: number;
  fcRep: number;
}

export const HeartRateZonesTable = ({ zones, fcMax, fcRep }: HeartRateZonesTableProps) => {
  if (!zones.length) {
    return (
      <Card className="mt-6">
        <div className="text-center py-8 text-slate-400">
          <p>Ingresa FCM y FCRep para ver las zonas de entrenamiento</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <h3 className="text-lg font-bold text-white">Zonas de Frecuencia Cardíaca</h3>
        </div>

        {/* Datos de referencia */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-900/50 rounded-lg mb-4">
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase font-bold">FCMax</p>
            <p className="text-xl font-bold text-emerald-500">{fcMax} ppm</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase font-bold">FCRep</p>
            <p className="text-xl font-bold text-blue-500">{fcRep} ppm</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-400 uppercase font-bold">Reserva FC</p>
            <p className="text-xl font-bold text-purple-500">{fcMax - fcRep} ppm</p>
          </div>
        </div>

        {/* Tabla responsiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-slate-300 font-bold bg-slate-900/50">Zona</th>
                <th className="px-4 py-3 text-center text-slate-300 font-bold bg-slate-900/50">Intensidad</th>
                <th className="px-4 py-3 text-center text-slate-300 font-bold bg-slate-900/50">FCTrab (Min)</th>
                <th className="px-4 py-3 text-center text-slate-300 font-bold bg-slate-900/50">FCTrab (Max)</th>
                <th className="px-4 py-3 text-left text-slate-300 font-bold bg-slate-900/50">Tipo de Trabajo</th>
                <th className="px-4 py-3 text-left text-slate-300 font-bold bg-slate-900/50">Duración</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((zone) => {
                const zoneColors: { [key: string]: string } = {
                  A1: 'bg-blue-500/10 border-l-4 border-l-blue-500',
                  A2: 'bg-cyan-500/10 border-l-4 border-l-cyan-500',
                  A3: 'bg-green-500/10 border-l-4 border-l-green-500',
                  A4: 'bg-yellow-500/10 border-l-4 border-l-yellow-500',
                  A5: 'bg-orange-500/10 border-l-4 border-l-orange-500',
                  A6: 'bg-red-500/10 border-l-4 border-l-red-500',
                };

                const zoneTextColors: { [key: string]: string } = {
                  A1: 'text-blue-400',
                  A2: 'text-cyan-400',
                  A3: 'text-green-400',
                  A4: 'text-yellow-400',
                  A5: 'text-orange-400',
                  A6: 'text-red-400',
                };

                return (
                  <tr
                    key={zone.zoneCode}
                    className={`border-b border-slate-700 hover:bg-slate-800/50 transition-colors ${zoneColors[zone.zoneCode]}`}
                  >
                    <td className="px-4 py-4">
                      <span className={`font-bold text-lg ${zoneTextColors[zone.zoneCode]}`}>
                        {zone.zoneCode}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-white">
                      {zone.minIntensity}% - {zone.maxIntensity}%
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-emerald-400">{zone.minBpm}</span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="font-bold text-emerald-400">{zone.maxBpm}</span>
                    </td>
                    <td className="px-4 py-4 text-slate-300">
                      {zone.trainingType}
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-xs">
                      {zone.duration}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Leyenda de clasificación */}
        <div className="mt-6 p-4 bg-slate-900/50 rounded-lg">
          <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-400" />
            Clasificación por Duración
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <span className="font-bold text-emerald-500 mt-0.5">Intensiva:</span>
              <span className="text-slate-400">Hasta los 30 minutos</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-bold text-emerald-500 mt-0.5">Extensiva:</span>
              <span className="text-slate-400">Pasado los 30 minutos</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
