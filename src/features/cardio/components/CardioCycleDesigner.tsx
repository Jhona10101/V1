import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';

interface Cycle {
  id: number;
  level: string;
  intensity: number;
  time: number;
}

interface CardioCycleDesignerProps {
  onDetailChange: (details: { cycles: Cycle[] }) => void;
  initialCycles?: Cycle[];
}

const CardioCycleDesigner: React.FC<CardioCycleDesignerProps> = ({ onDetailChange, initialCycles = [] }) => {
  const [cycles, setCycles] = useState<Cycle[]>(initialCycles);

  useEffect(() => {
    onDetailChange({ cycles });
  }, [cycles, onDetailChange]);

  const addCycle = () => {
    const newCycle: Cycle = {
      id: Date.now(),
      level: 'A1',
      intensity: 50,
      time: 60, // in seconds
    };
    setCycles([...cycles, newCycle]);
  };

  const handleCycleChange = (id: number, field: keyof Cycle, value: string | number) => {
    const updatedCycles = cycles.map((cycle) => {
      if (cycle.id === id) {
        return { ...cycle, [field]: value };
      }
      return cycle;
    });
    setCycles(updatedCycles);
  };

  const removeCycle = (id: number) => {
    const updatedCycles = cycles.filter((cycle) => cycle.id !== id);
    setCycles(updatedCycles);
  };

  return (
    <div className="mt-4 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Diseñador de Ciclos de Cardio</h3>
        <Button onClick={addCycle}>Añadir Ciclo</Button>
      </div>
      <div className="space-y-4">
        {cycles.map((cycle, index) => (
          <div key={cycle.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-lg">Ciclo {index + 1}</h4>
              <Button variant="outline" onClick={() => removeCycle(cycle.id)} className="text-red-500 border-red-500/50 hover:bg-red-900/50 hover:text-red-400">
                Eliminar
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`level-${cycle.id}`}>Nivel</Label>
                <Input
                  id={`level-${cycle.id}`}
                  value={cycle.level}
                  onChange={(e) => handleCycleChange(cycle.id, 'level', e.target.value)}
                  placeholder="Ej: A1, R1"
                />
              </div>
              <div>
                <Label htmlFor={`intensity-${cycle.id}`}>Intensidad (%)</Label>
                <Input
                  id={`intensity-${cycle.id}`}
                  type="number"
                  value={cycle.intensity}
                  onChange={(e) => handleCycleChange(cycle.id, 'intensity', parseInt(e.target.value, 10) || 0)}
                />
              </div>
              <div>
                <Label htmlFor={`time-${cycle.id}`}>Tiempo (segundos)</Label>
                <Input
                  id={`time-${cycle.id}`}
                  type="number"
                  value={cycle.time}
                  onChange={(e) => handleCycleChange(cycle.id, 'time', parseInt(e.target.value, 10) || 0)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      {cycles.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <p>No hay ciclos definidos. Haz clic en "Añadir Ciclo" para empezar.</p>
        </div>
      )}
    </div>
  );
};

export default CardioCycleDesigner;
