import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthSession {
  token: string;
  email: string;
  expiresAt: number;
}

interface AuthState {
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  logout: () => void;
}

/**
 * Sessão de autenticação — única fonte de verdade do token, persistida em
 * localStorage (é um produto real rodando no navegador, não um artifact do
 * Claude, então localStorage é apropriado aqui). Verifica expiração do token
 * localmente antes de considerar a sessão válida.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      logout: () => set({ session: null }),
    }),
    { name: "people-hub-auth" },
  ),
);

export function isSessionValid(session: AuthSession | null): session is AuthSession {
  return !!session && session.expiresAt > Date.now();
}

export function getAuthToken(): string | null {
  const session = useAuthStore.getState().session;
  return isSessionValid(session) ? session.token : null;
}
