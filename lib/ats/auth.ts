import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AuthContext, Profile } from "@/lib/ats/types";

export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createSupabaseServerClient();
  const { data: userResult } = await supabase.auth.getUser();
  const user = userResult.user;
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;
  return { userId: user.id, email: user.email ?? null, profile: profile as Profile };
}

export async function requireCandidate() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (context.profile.role === "admin") redirect("/admin");
  return context;
}

export async function requireAdmin() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  if (context.profile.role !== "admin") redirect("/candidate");
  return context;
}
