
import React, { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useUserStore } from '../../../store/user.store';
import { useToastStore } from '@/store/toast.store';

interface UpdateProfileFormProps {
  onClose: () => void;
}

const UpdateProfileForm: React.FC<UpdateProfileFormProps> = ({ onClose }) => {
  const { user } = useUserStore();
  const showToast = useToastStore((state) => state.showToast);
  const [formData, setFormData] = useState({
    phone: '',
    height: '',
    weight: '',
    age: '',
    goal: '',
  });

  useEffect(() => {
    if (user?.uid) {
      const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        const userData = doc.data();
        if (userData) {
          setFormData({
            phone: userData.phone || '',
            height: userData.height || '',
            weight: userData.weight || '',
            age: userData.age || '',
            goal: userData.goal || '',
          });
        }
      });
      return () => unsub();
    }
  }, [user?.uid]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.uid) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          ...formData,
          height: Number(formData.height),
          weight: Number(formData.weight),
          age: Number(formData.age),
        });
        showToast('Perfil actualizado con éxito', 'success');
        onClose();
      } catch (error) {
        console.error('Error updating profile: ', error);
        showToast('Error al actualizar el perfil', 'error');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label htmlFor="phone" className="block text-sm font-medium text-slate-400">Teléfono</label>
          <input
            type="text"
            name="phone"
            id="phone"
            placeholder="Ej: 3001234567"
            onChange={handleChange}
            value={formData.phone}
            className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-white"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="height" className="block text-sm font-medium text-slate-400">Talla (cm)</label>
          <input
            type="number"
            name="height"
            id="height"
            placeholder="Ej: 175"
            onChange={handleChange}
            value={formData.height}
            className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-white"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="weight" className="block text-sm font-medium text-slate-400">Peso (kg)</label>
          <input
            type="number"
            name="weight"
            id="weight"
            placeholder="Ej: 70.5"
            onChange={handleChange}
            value={formData.weight}
            className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-white"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="age" className="block text-sm font-medium text-slate-400">Edad</label>
          <input
            type="number"
            name="age"
            id="age"
            placeholder="Ej: 25"
            onChange={handleChange}
            value={formData.age}
            className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-white"
          />
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="goal" className="block text-sm font-medium text-slate-400">Objetivo</label>
        <textarea
          name="goal"
          id="goal"
          placeholder="Describe tu objetivo principal (ej: ganar masa muscular, perder peso, mejorar rendimiento...)"
          onChange={handleChange}
          value={formData.goal}
          className="mt-1 block w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-white"
        />
      </div>
      <div className="flex justify-end gap-4 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="bg-slate-700 text-slate-300 px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-900/20"
        >
          Actualizar
        </button>
      </div>
    </form>
  );
};

export default UpdateProfileForm;
