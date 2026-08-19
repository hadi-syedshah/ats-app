import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/ats/api-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { context, response } = await requireApiUser();
  if (response || !context) return response!;
  const { id } = await params;
  const admin = createSupabaseAdminClient();

  const { data: cv, error: cvError } = await admin
    .from("cvs")
    .select("id,user_id,file_url")
    .eq("id", id)
    .maybeSingle();
  if (cvError || !cv) return NextResponse.json({ error: "CV not found." }, { status: 404 });
  if (cv.user_id !== context.userId && context.profile.role !== "admin") {
    return NextResponse.json({ error: "You may only delete your own CVs." }, { status: 403 });
  }

  const { error: deleteError } = await admin.from("cvs").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });
  await admin.storage.from("cvs").remove([cv.file_url]);
  return NextResponse.json({ success: true });
}
