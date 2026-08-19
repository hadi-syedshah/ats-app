import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export const createSupabaseAdminClient = () =>
  createClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false }
  });
