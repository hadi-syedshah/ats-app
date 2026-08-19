const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

export const env = {
  supabaseUrl: () => required("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => required("SUPABASE_SERVICE_ROLE_KEY"),
  parserServiceUrl: () => process.env.PARSER_SERVICE_URL?.replace(/\/$/, "") ?? "",
  internalServiceSecret: () => required("INTERNAL_SERVICE_SECRET"),
  hasNvidiaNimKey: () => Boolean(process.env.NVIDIA_NIM_API_KEY)
};

export const hasSupabaseConfig = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
