import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configurados. Veja o README para o passo a passo de configuração do Supabase.",
  );
}

export const supabase = createClient(supabaseUrl ?? "https://placeholder.supabase.co", supabaseAnonKey ?? "placeholder");

export class SupabaseOpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseOpError";
  }
}

/** Lança um erro legível quando uma chamada ao Supabase falha. */
export function throwIfError(error: { message: string } | null): void {
  if (error) throw new SupabaseOpError(error.message);
}
