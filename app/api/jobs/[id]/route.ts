import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/ats/api-auth";
import { jobInputSchema } from "@/lib/ats/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiAdmin();
  if (response) return response;
  const input = jobInputSchema.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: "The job details are invalid." }, { status: 400 });
  const { id } = await params;
  const { data, error } = await createSupabaseAdminClient()
    .from("jobs")
    .update({ title: input.data.title, description: input.data.description, required_skills: input.data.requiredSkills, is_active: input.data.isActive })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ job: data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiAdmin();
  if (response) return response;
  const { id } = await params;
  const { error } = await createSupabaseAdminClient().from("jobs").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
