import { useState } from 'react';
import { Client } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, Edit2 } from 'lucide-react';

interface RoutineDesignerProps {
  client: Client;
  onClose: () => void;
}

export const RoutineDesigner = ({ client, onClose }: RoutineDesignerProps) => {
  const [routines, setRoutines] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddRoutine = () => {
    setShowForm(true);
    setEditingId(null);
  };

  const handleSaveRoutine = () => {
    setShowForm(false);
  };

  const handleDeleteRoutine = (id: string) => {
    setRoutines(routines.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-100">Diseñador de Rutinas</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          ✕
        </button>
      </div>

      <Card>
        <div className="space-y-4">
          <button
            onClick={handleAddRoutine}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Rutina
          </button>

          {routines.length === 0 && !showForm && (
            <p className="text-center text-slate-500 py-8">
              No hay rutinas. Crea una nueva para comenzar.
            </p>
          )}

          {routines.map((routine) => (
            <div
              key={routine.id}
              className="p-4 bg-slate-800 rounded-lg border border-slate-700 flex justify-between items-center"
            >
              <div>
                <h4 className="font-semibold text-slate-100">{routine.name}</h4>
                <p className="text-sm text-slate-400">{routine.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(routine.id);
                    setShowForm(true);
                  }}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-blue-400" />
                </button>
                <button
                  onClick={() => handleDeleteRoutine(routine.id)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
