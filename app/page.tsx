import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/ats/auth";
import { hasSupabaseConfig } from "@/lib/env";
import { Brand } from "@/components/brand";

export default async function Home() {
  if (hasSupabaseConfig()) {
    const context = await getAuthContext();
    if (context) redirect(context.profile.role === "admin" ? "/admin" : "/candidate");
  }
  return <main className="shell marketing-shell"><header className="topbar"><div className="container topbar-inner"><Brand /><Link className="button button-primary button-small" href="/login">Sign in</Link></div></header><section className="container marketing-hero"><div className="hero-copy"><p className="eyebrow">Candidate evaluation, made legible</p><h1>A clear path from application to decision.</h1><p className="hero-lede">Verity turns incoming CVs into validated applications, structured evaluations, and clear hiring decisions.</p><div className="hero-actions"><Link className="button button-primary" href="/login">Open the workspace</Link><span className="hero-signal"><span aria-hidden>✓</span> Secure by role and design</span></div></div><div className="workflow-panel" aria-label="Verity application workflow"><div className="workflow-panel-head"><span className="eyebrow">Structured progression</span><span className="chip chip-success">Live workflow</span></div><div className="workflow-steps"><div className="workflow-step is-complete"><span className="step-index">01</span><div><strong>Application</strong><p>Validated CV submission</p></div><span className="step-mark">✓</span></div><div className="workflow-step is-active"><span className="step-index">02</span><div><strong>Evaluation</strong><p>Skills matched to role needs</p></div><span className="step-mark">→</span></div><div className="workflow-step"><span className="step-index">03</span><div><strong>Decision</strong><p>Evidence ready for review</p></div><span className="step-mark">↗</span></div></div><div className="workflow-panel-footer"><span>One clear record</span><span>for every application</span></div></div></section></main>;
}
