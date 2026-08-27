import { supabase } from "../../lib/supabaseClient";

export const authApi = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  /**
   * Reautentica con la contraseña actual (para confirmar identidad) y luego
   * actualiza email e/ou senha via Supabase Auth. Se o email for alterado, o
   * Supabase puede exigir confirmación por link enviado a la nueva casilla de
   * entrada (depende de la configuración "Confirm email" del proyecto).
   */
  updateCredentials: async ({ currentPassword, newEmail, newPassword }: { currentPassword: string; newEmail?: string; newPassword?: string }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user.email;
    if (!email) throw new Error("Sesión inválida. Inicia sesión de nuevo.");

    const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (reauthError) throw new Error("Contraseña actual incorrecta.");

    const { data, error } = await supabase.auth.updateUser({
      ...(newEmail ? { email: newEmail } : {}),
      ...(newPassword ? { password: newPassword } : {}),
    });
    if (error) throw error;
    return data;
  },
};
