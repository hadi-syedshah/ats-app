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

  return <main className="auth-shell"><aside className="auth-aside"><Brand /><p className="eyebrow" style={{ color: "#86e4d8", marginTop: 70 }}>Designed for thoughtful hiring</p><h1>Make every application count.</h1><p>Verity puts candidates, job requirements, and structured screening in one uncluttered workflow.</p></aside><section className="auth-panel"><div className="auth-card"><p className="eyebrow">Secure sign in</p><h1 style={{ margin: "0 0 8px", letterSpacing: "-.04em" }}>{mode === "signin" ? "Welcome back" : "Create your account"}</h1><p className="panel-note">Use your email address and a secure password to access the applicant workspace.</p><form className="form-grid" style={{ marginTop: 24 }} onSubmit={submit}>{mode === "signup" && <div className="field"><label htmlFor="name">Full name</label><input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>}<div className="field"><label htmlFor="email">Email</label><input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><div className="field"><label htmlFor="password">Password</label><input id="password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>{message && <div className="alert alert-info">{message}</div>}<button className="button button-primary" disabled={loading}>{loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button></form><p className="panel-note" style={{ marginTop: 18 }}>{mode === "signin" ? "New to Verity?" : "Already have an account?"} <button onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }} style={{ border: 0, background: "none", color: "var(--teal)", fontWeight: 800 }}>{mode === "signin" ? "Create an account" : "Sign in"}</button></p></div></section></main>;
}
