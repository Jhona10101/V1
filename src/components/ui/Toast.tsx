import React, { useEffect } from 'react';
import { useToastStore } from '@/store/toast.store';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const toastIcons = {
  success: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
  error: <XCircle className="w-6 h-6 text-red-500" />,
  default: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
};

const Toast = () => {
  const { isOpen, message, type, hideToast } = useToastStore();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        hideToast();
      }, 3000); // Auto-hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen, hideToast]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed top-5 right-5 z-[100] animate-in fade-in slide-in-from-top-5 duration-300">
      <div className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
        {toastIcons[type]}
        <p className="font-medium text-white">{message}</p>
        <button onClick={hideToast} className="text-slate-500 hover:text-white transition-colors">
          <XCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
