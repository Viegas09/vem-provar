import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Faltam as variáveis VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor.");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
