
import React, { useState } from 'react';
import UpdateProfileForm from './UpdateProfileForm';

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpdateProfileModal: React.FC<UpdateProfileModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
        <h2 className="text-2xl font-bold mb-2 text-center text-white">Actualiza tu perfil</h2>
        <p className="text-slate-400 mb-6 text-center text-sm">
          Para usar nuestro sistema, necesitamos que completes tu información personal.
        </p>
        <UpdateProfileForm onClose={onClose} />
      </div>
    </div>
  );
};

export default UpdateProfileModal;
