import { CandidateWorkspace } from "@/components/candidate-workspace";
import { SetupNotice } from "@/components/setup-notice";
import { Topbar } from "@/components/topbar";
import { requireCandidate } from "@/lib/ats/auth";
import type { Cv, Job } from "@/lib/ats/types";
import { hasSupabaseConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CandidatePage() {
  if (!hasSupabaseConfig()) return <SetupNotice />;
  const context = await requireCandidate();
  const supabase = await createSupabaseServerClient();
  const [{ data: jobs }, { data: cvs }] = await Promise.all([
    supabase.from("jobs").select("*").eq("is_active", true).order("created_at", { ascending: false }),
    supabase.from("cvs").select("*,jobs(id,title),parsed_data(*),evaluations(*)").eq("user_id", context.userId).order("uploaded_at", { ascending: false })
  ]);
  return <main className="shell"><Topbar role="candidate" /><section className="container section-space"><div className="page-head"><div><p className="eyebrow">Candidate workspace</p><h1>Find the role that fits.</h1><p className="subcopy">Browse current opportunities, submit a CV securely, and follow each application through screening.</p></div><span className="chip chip-success">Signed in as {context.profile.full_name || context.email || "candidate"}</span></div><CandidateWorkspace jobs={(jobs ?? []) as Job[]} initialCvs={(cvs ?? []) as unknown as Cv[]} /></section></main>;
}
