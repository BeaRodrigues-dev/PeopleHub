import { supabase } from "../../lib/supabaseClient";

export const authApi = {
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  /**
   * Reautentica com a senha atual (para confirmar identidade) e então
   * atualiza email e/ou senha via Supabase Auth. Se o email for alterado, o
   * Supabase pode exigir confirmação por link enviado à nova caixa de
   * entrada (depende da configuração "Confirm email" do projeto).
   */
  updateCredentials: async ({ currentPassword, newEmail, newPassword }: { currentPassword: string; newEmail?: string; newPassword?: string }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user.email;
    if (!email) throw new Error("Sessão inválida. Faça login novamente.");

    const { error: reauthError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (reauthError) throw new Error("Senha atual incorreta.");

    const { data, error } = await supabase.auth.updateUser({
      ...(newEmail ? { email: newEmail } : {}),
      ...(newPassword ? { password: newPassword } : {}),
    });
    if (error) throw error;
    return data;
  },
};
