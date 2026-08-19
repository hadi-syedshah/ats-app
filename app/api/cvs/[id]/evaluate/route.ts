import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/ats/api-auth";
import { evaluateWithNim, evaluationConfiguration } from "@/lib/ats/evaluation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiAdmin();
  if (response) return response;
  const config = evaluationConfiguration();
  if (!config.configured) return NextResponse.json({ error: config.message }, { status: 412 });

  const { id } = await params;
  const admin = createSupabaseAdminClient();
  const { data: cv, error: cvError } = await admin
    .from("cvs")
    .select("id,user_id,status,job_id,jobs(id,title,description,required_skills),parsed_data(name,skills,raw_text)")
    .eq("id", id)
    .maybeSingle();
  if (cvError) return NextResponse.json({ error: cvError.message }, { status: 400 });
  if (!cv) return NextResponse.json({ error: "CV not found." }, { status: 404 });
  if (cv.status !== "parsed") return NextResponse.json({ error: "Only parsed CVs can be evaluated." }, { status: 409 });
  if (!cv.job_id) return NextResponse.json({ error: "Assign a job before evaluating this CV." }, { status: 409 });
  const job = Array.isArray(cv.jobs) ? cv.jobs[0] : cv.jobs;
  const parsed = Array.isArray(cv.parsed_data) ? cv.parsed_data[0] : cv.parsed_data;
  if (!job || !parsed) return NextResponse.json({ error: "A parsed CV and job description are required before evaluation." }, { status: 409 });

  const { data: claimed, error: claimError } = await admin
    .from("cvs")
    .update({ status: "evaluating" })
    .eq("id", id)
    .eq("status", "parsed")
    .select("id")
    .maybeSingle();
  if (claimError || !claimed) return NextResponse.json({ error: "This CV is already being evaluated or its status changed." }, { status: 409 });

  try {
    const evaluation = await evaluateWithNim({
      job: { title: job.title, description: job.description, requiredSkills: job.required_skills ?? [] },
      candidate: { name: parsed.name, skills: parsed.skills, rawText: parsed.raw_text }
    });
    const evaluationRecord = {
      cv_id: id,
      user_id: cv.user_id,
      job_id: cv.job_id,
      score: evaluation.score,
      matched_skills: evaluation.matched_skills,
      missing_skills: evaluation.missing_skills,
      feedback: evaluation.feedback,
      model_used: process.env.NVIDIA_NIM_MODEL || "meta/llama-3.1-8b-instruct"
    };
    const { data: existing, error: existingError } = await admin
      .from("evaluations")
      .select("id")
      .eq("cv_id", id)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    const { error: saveError } = existing
      ? await admin.from("evaluations").update(evaluationRecord).eq("id", existing.id)
      : await admin.from("evaluations").insert(evaluationRecord);
    if (saveError) throw new Error(saveError.message);
    const { error: statusError } = await admin.from("cvs").update({ status: "evaluated" }).eq("id", id);
    if (statusError) throw statusError;
    return NextResponse.json({ evaluation }, { status: 200 });
  } catch (error) {
    await admin.from("cvs").update({ status: "failed" }).eq("id", id);
    const message = error instanceof Error ? error.message : "Evaluation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
