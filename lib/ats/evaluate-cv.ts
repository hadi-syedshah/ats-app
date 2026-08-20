import { evaluateWithNim, evaluationConfiguration, type NimEvaluation } from "@/lib/ats/evaluation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type EvaluationTrigger = "automatic" | "manual";
type EvaluationOutcome =
  | { state: "evaluated"; evaluation: NimEvaluation }
  | { state: "skipped"; reason: string };

const readyStatuses = ["parsed", "evaluated", "failed"];

export async function evaluateCv(cvId: string, trigger: EvaluationTrigger): Promise<EvaluationOutcome> {
  const configuration = evaluationConfiguration();
  if (!configuration.configured) return { state: "skipped", reason: configuration.message };

  const admin = createSupabaseAdminClient();
  const { data: cv, error: cvError } = await admin
    .from("cvs")
    .select("id,user_id,status,job_id,jobs(id,title,description,required_skills),parsed_data(name,skills,raw_text)")
    .eq("id", cvId)
    .maybeSingle();
  if (cvError) throw new Error(cvError.message);
  if (!cv) return { state: "skipped", reason: "CV not found." };
  if (!cv.job_id) return { state: "skipped", reason: "No linked job; automatic evaluation is skipped." };

  const job = Array.isArray(cv.jobs) ? cv.jobs[0] : cv.jobs;
  const parsed = Array.isArray(cv.parsed_data) ? cv.parsed_data[0] : cv.parsed_data;
  if (!job || !parsed) return { state: "skipped", reason: "A parsed CV and job description are required before evaluation." };
  if (!readyStatuses.includes(cv.status)) return { state: "skipped", reason: "This CV is already being evaluated or is not ready." };

  const { data: claimed, error: claimError } = await admin
    .from("cvs")
    .update({ status: "evaluating" })
    .eq("id", cvId)
    .in("status", readyStatuses)
    .select("id")
    .maybeSingle();
  if (claimError) throw new Error(claimError.message);
  if (!claimed) return { state: "skipped", reason: "This CV is already being evaluated or its status changed." };

  try {
    const evaluation = await evaluateWithNim({
      job: { title: job.title, description: job.description, requiredSkills: job.required_skills ?? [] },
      candidate: { name: parsed.name, skills: parsed.skills, rawText: parsed.raw_text }
    });
    const record = {
      cv_id: cvId,
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
      .eq("cv_id", cvId)
      .limit(1)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    const { error: saveError } = existing
      ? await admin.from("evaluations").update(record).eq("id", existing.id)
      : await admin.from("evaluations").insert(record);
    if (saveError) throw new Error(saveError.message);
    const { error: statusError } = await admin.from("cvs").update({ status: "evaluated" }).eq("id", cvId);
    if (statusError) throw statusError;
    return { state: "evaluated", evaluation };
  } catch (error) {
    await admin.from("cvs").update({ status: "failed" }).eq("id", cvId);
    const message = error instanceof Error ? error.message : "Evaluation failed.";
    throw new Error(`${trigger} evaluation failed: ${message}`);
  }
}
