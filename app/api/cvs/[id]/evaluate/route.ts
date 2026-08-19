import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/ats/api-auth";
import { evaluationConfiguration } from "@/lib/ats/evaluation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiAdmin();
  if (response) return response;
  const config = evaluationConfiguration();
  if (!config.configured) return NextResponse.json({ error: config.message }, { status: 412 });

  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: cv } = await admin.from("cvs").select("id,status,job_id").eq("id", id).maybeSingle();
  if (!cv) return NextResponse.json({ error: "CV not found." }, { status: 404 });
  if (cv.status !== "parsed") return NextResponse.json({ error: "Only parsed CVs can be evaluated." }, { status: 409 });
  if (!cv.job_id) return NextResponse.json({ error: "Assign a job before evaluating this CV." }, { status: 409 });

  return NextResponse.json({ error: "Evaluation execution will be enabled only after the NVIDIA NIM key is supplied and configured." }, { status: 412 });
}
