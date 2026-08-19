import { AdminWorkspace } from "@/components/admin-workspace";
import { SetupNotice } from "@/components/setup-notice";
import { Topbar } from "@/components/topbar";
import { requireAdmin } from "@/lib/ats/auth";
import type { Cv, Job } from "@/lib/ats/types";
import { evaluationConfiguration } from "@/lib/ats/evaluation";
import { hasSupabaseConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  if (!hasSupabaseConfig()) return <SetupNotice />;
  const context = await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const [{ data: jobs }, { data: cvs }] = await Promise.all([
    supabase.from("jobs").select("*").order("created_at", { ascending: false }),
    supabase.from("cvs").select("*,jobs(id,title),profiles(full_name,email),parsed_data(*),evaluations(*)").order("uploaded_at", { ascending: false })
  ]);
  return <main className="shell"><Topbar role="admin" /><section className="container section-space"><div className="page-head"><div><p className="eyebrow">Hiring workspace</p><h1>Review the work behind every application.</h1><p className="subcopy">Manage openings, screen CVs by role, and keep evaluation decisions comparable and auditable.</p></div><span className="chip chip-success">{context.profile.full_name || context.email || "Administrator"}</span></div><AdminWorkspace initialJobs={(jobs ?? []) as Job[]} initialCvs={(cvs ?? []) as unknown as Cv[]} evaluationConfigured={evaluationConfiguration().configured} /></section></main>;
}
