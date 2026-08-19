import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/ats/api-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { context, response } = await requireApiUser();
  if (response || !context) return response!;
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("cvs")
    .select("id,user_id,job_id,file_url,file_name,file_size_bytes,status,parsed_text,uploaded_at,jobs(id,title),profiles(full_name,email),parsed_data(*),evaluations(*)")
    .order("uploaded_at", { ascending: false });
  if (context.profile.role !== "admin") query = query.eq("user_id", context.userId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ cvs: data });
}
