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
  return <main className="shell"><header className="topbar"><div className="container topbar-inner"><Brand /><Link className="button button-primary button-small" href="/login">Sign in</Link></div></header><section className="container" style={{ paddingTop: 96, paddingBottom: 80 }}><p className="eyebrow">Candidate evaluation, made legible</p><div className="grid grid-2" style={{ alignItems: "end" }}><div><h1 style={{ fontSize: "clamp(44px,7vw,82px)", lineHeight: .94, letterSpacing: "-.07em", margin: 0 }}>A clear path from application to decision.</h1></div><div className="card card-pad"><h2 className="panel-title">A purpose-built ATS workspace</h2><p className="panel-note">Candidates browse roles and submit validated CVs. Hiring teams review progression, structured data, and evaluations against the requirements of each role.</p><Link className="button button-primary" style={{ marginTop: 16 }} href="/login">Open the workspace</Link></div></div></section></main>;
}
