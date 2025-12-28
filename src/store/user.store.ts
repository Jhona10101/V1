import { create } from 'zustand';
import { Admin, Coach, Client } from '@/types';

type UserProfile = Admin | Coach | Client;

interface UserState {
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoading: true, // Empezamos en true hasta que Firebase verifique el estado
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
}));