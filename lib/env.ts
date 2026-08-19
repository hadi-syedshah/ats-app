const required = (value: string | undefined, name: string): string => {
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

const supabaseProjectUrl = (value: string) => value.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");

export const env = {
  supabaseUrl: () => supabaseProjectUrl(required(process.env.NEXT_PUBLIC_SUPABASE_URL, "NEXT_PUBLIC_SUPABASE_URL")),
  supabaseAnonKey: () => required(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => required(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY"),
  parserServiceUrl: () => process.env.PARSER_SERVICE_URL?.replace(/\/$/, "") ?? "",
  internalServiceSecret: () => required(process.env.INTERNAL_SERVICE_SECRET, "INTERNAL_SERVICE_SECRET"),
  hasNvidiaNimKey: () => Boolean(process.env.NVIDIA_NIM_API_KEY),
  nvidiaNimApiUrl: () => process.env.NVIDIA_NIM_API_URL?.replace(/\/$/, "") || "https://integrate.api.nvidia.com/v1/chat/completions",
  nvidiaNimModel: () => process.env.NVIDIA_NIM_MODEL || "meta/llama-3.1-8b-instruct"
};

export const hasSupabaseConfig = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
