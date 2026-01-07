import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';

interface CardioCycleDesignerProps {
  clientId: string;
  onDetailChange: (details: any) => void;
}

const CardioCycleDesigner: React.FC<CardioCycleDesignerProps> = ({ clientId, onDetailChange }) => {
  const [cycles, setCycles] = useState([]);

  useEffect(() => {
    // onDetailChange({ cycles });
  }, [cycles, onDetailChange]);

  const addCycle = () => {
    const newCycle = {
      id: Date.now(),
      level: 'A1',
      intensity: 50,
      minHr: 0,
      maxHr: 0,
      time: 60, // in seconds
    };
    setCycles([...cycles, newCycle]);
  };

  return (
    <div className="mt-4 space-y-6">
      <div>
        <Button onClick={addCycle}>Añadir Ciclo</Button>
      </div>
      <div className="space-y-4">
        {cycles.map((cycle, index) => (
          <div key={cycle.id} className="p-4 border rounded-lg">
            <h4 className="font-semibold text-lg mb-2">Ciclo {index + 1}</h4>
            {/* Cycle form will go here */}
          </div>
        ))}
      </div>
      <div className="mt-6">
        <h4 className="font-semibold text-lg mb-2">Cardiograma de la Sesión</h4>
        {/* Chart will go here */}
        <div className="h-60 bg-gray-100 border rounded-lg p-4 text-center">
          <p>El gráfico se mostrará aquí</p>
        </div>
      </div>
    </div>
  );
};

export default CardioCycleDesigner;
