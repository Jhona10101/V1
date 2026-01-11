import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'default';

interface ToastState {
  message: string;
  type: ToastType;
  isOpen: boolean;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  type: 'default',
  isOpen: false,
  showToast: (message, type = 'default') => set({ message, type, isOpen: true }),
  hideToast: () => set({ isOpen: false }),
}));
