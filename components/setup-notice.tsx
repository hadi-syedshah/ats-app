import Link from "next/link";
import { Brand } from "@/components/brand";

export function SetupNotice() {
  return <main className="shell"><header className="topbar"><div className="container topbar-inner"><Brand /><Link href="/" className="button button-secondary button-small">Back</Link></div></header><section className="container" style={{ paddingTop: 88 }}><div className="card card-pad" style={{ maxWidth: 650 }}><p className="eyebrow">Configuration required</p><h1 style={{ margin: 0, letterSpacing: "-.04em" }}>Connect Supabase to enable the ATS.</h1><p className="subcopy">The application interface is ready, but it requires the Supabase URL and anonymous key before authentication, job listings, CV storage, and RLS-backed data can be accessed.</p></div></section></main>;
}
