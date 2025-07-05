import { create } from 'zustand';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  role: 'admin' | 'shopkeeper' | 'customer' | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setRole: (role: 'admin' | 'shopkeeper' | 'customer' | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  role: null,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setRole: (role) => set({ role }),
}));