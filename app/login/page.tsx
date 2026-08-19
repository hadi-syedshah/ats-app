"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "@/components/brand";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setMessage(""); setLoading(true);
    const supabase = createSupabaseBrowserClient();
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName }, emailRedirectTo: `${location.origin}/auth/callback` } });
      setLoading(false); setMessage(error ? error.message : "Check your inbox to confirm your account, then sign in."); return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) { setLoading(false); setMessage(error?.message ?? "Could not sign in."); return; }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
    setLoading(false);
    if (!profile) { setMessage("Your profile is still being created. Please retry in a moment."); return; }
    router.replace(profile.role === "admin" ? "/admin" : "/candidate"); router.refresh();
  }

  return <main className="auth-shell"><aside className="auth-aside"><Brand /><div className="auth-geometry" aria-hidden><span /><span /><span /></div><div className="auth-aside-copy"><p className="eyebrow">Designed for thoughtful hiring</p><h1>Make every application <em>count.</em></h1><p>Verity keeps candidate context, role requirements, and evaluation signals in a single readable system.</p><div className="auth-promise"><span>01</span><span>Validated intake</span><span>02</span><span>Evidence-led review</span></div></div></aside><section className="auth-panel"><div className="auth-card"><p className="eyebrow">Secure access / 01</p><h1>{mode === "signin" ? "Welcome back." : "Create your account."}</h1><p className="panel-note">Use your email address and a secure password to access the Verity workspace.</p><form className="form-grid" onSubmit={submit}>{mode === "signup" && <div className="field"><label htmlFor="name">Full name</label><input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>}<div className="field"><label htmlFor="email">Email</label><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><div className="field"><label htmlFor="password">Password</label><input id="password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>{message && <div className="alert alert-info">{message}</div>}<button className="button button-primary" disabled={loading}>{loading ? "Please wait…" : mode === "signin" ? "Sign in to workspace" : "Create account"}<span aria-hidden>↗</span></button></form><p className="panel-note auth-switch-copy">{mode === "signin" ? "New to Verity?" : "Already have an account?"} <button type="button" className="auth-switch" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>{mode === "signin" ? "Create an account" : "Sign in"}</button></p></div></section></main>;
}
