import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY no configurados. Vea el README para los pasos de configuración de Supabase.",
  );
}

export const supabase = createClient(supabaseUrl ?? "https://placeholder.supabase.co", supabaseAnonKey ?? "placeholder");

export class SupabaseOpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseOpError";
  }
}

/** Lanza un error legible cuando una llamada a Supabase falla. */
export function throwIfError(error: { message: string } | null): void {
  if (error) throw new SupabaseOpError(error.message);
}
