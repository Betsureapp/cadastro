import { create } from 'zustand';
import { supabase, Profile, Associate, ApplicationStatus } from '@/lib/supabase';

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      await get().fetchProfile();
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erro ao fazer login' };
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    set({
      user: profile as Profile,
      isAuthenticated: true,
      isLoading: false
    });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      await get().fetchProfile();
    } catch {
      set({ isLoading: false });
    }
  },
}));

interface AppState {
  associates: Associate[];
  isLoadingAssociates: boolean;
  selectedAssociate: Associate | null;

  fetchAssociates: () => Promise<void>;
  fetchAssociateById: (id: string) => Promise<Associate | null>;
  updateAssociateStatus: (id: string, status: ApplicationStatus) => Promise<{ success: boolean; error?: string }>;
  selectAssociate: (associate: Associate | null) => void;
  getAssociatesByStatus: (status: ApplicationStatus) => Associate[];
}

export const useAppStore = create<AppState>((set, get) => ({
  associates: [],
  isLoadingAssociates: false,
  selectedAssociate: null,

  fetchAssociates: async () => {
    set({ isLoadingAssociates: true });

    const { data, error } = await supabase
      .from('associates')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      set({ associates: data as Associate[] });
    }
    set({ isLoadingAssociates: false });
  },

  fetchAssociateById: async (id: string) => {
    const { data } = await supabase
      .from('associates')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      set({ selectedAssociate: data as Associate });
      return data as Associate;
    }
    return null;
  },

  updateAssociateStatus: async (id: string, status: ApplicationStatus) => {
    const { error } = await supabase
      .from('associates')
      .update({ status })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Atualiza lista local
    const associates = get().associates.map(a =>
      a.id === id ? { ...a, status } : a
    );
    set({ associates });

    return { success: true };
  },

  selectAssociate: (associate) => {
    set({ selectedAssociate: associate });
  },

  getAssociatesByStatus: (status: ApplicationStatus) => {
    return get().associates.filter(a => a.status === status);
  },
}));
