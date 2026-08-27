import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabaseClient";

interface AuthState {
  session: Session | null;
  /** Es `false` solo durante el instante inicial en que todavía estamos leyendo la sesión guardada por Supabase. */
  initialized: boolean;
  setSession: (session: Session | null) => void;
  logout: () => Promise<void>;
}

/**
 * Sesión de autenticación — ahora gestionada por el propio Supabase Auth (que ya
 * persiste o token em localStorage e cuida de refresh automático). Este
 * store só espelha o estado para os componentes React reagirem a ele.
 */
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  initialized: false,
  setSession: (session) => set({ session, initialized: true }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ session: null });
  },
}));

supabase.auth.getSession().then(({ data }) => useAuthStore.getState().setSession(data.session));
supabase.auth.onAuthStateChange((_event, session) => useAuthStore.getState().setSession(session));

export function isSessionValid(session: Session | null): session is Session {
  if (!session) return false;
  if (!session.expires_at) return true;
  return session.expires_at * 1000 > Date.now();
}

export function getAuthToken(): string | null {
  const session = useAuthStore.getState().session;
  return isSessionValid(session) ? session.access_token : null;
}
