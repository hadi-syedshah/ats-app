import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/ats/api-auth";
import { jobInputSchema } from "@/lib/ats/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const { context, response } = await requireApiAdmin();
  if (response || !context) return response!;
  const parsed = jobInputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Provide a title, a full description, and valid skill tags." }, { status: 400 });

  const { title, description, requiredSkills, isActive } = parsed.data;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("jobs")
    .insert({ title, description, required_skills: requiredSkills, is_active: isActive, created_by: context.userId })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ job: data }, { status: 201 });
}
