"use client";

import { useMemo, useState } from "react";
import type { Cv, Job } from "@/lib/ats/types";
import { StatusBadge } from "@/components/status-badge";

type Props = { initialJobs: Job[]; initialCvs: Cv[]; evaluationConfigured: boolean };
const skillsToArray = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);
const jobFor = (cv: Cv) => Array.isArray(cv.jobs) ? cv.jobs[0] : cv.jobs;
const profileFor = (cv: Cv) => Array.isArray(cv.profiles) ? cv.profiles[0] : cv.profiles;

export function AdminWorkspace({ initialJobs, initialCvs, evaluationConfigured }: Props) {
  const [jobs, setJobs] = useState(initialJobs);
  const [cvs, setCvs] = useState(initialCvs);
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState("all");
  const [editing, setEditing] = useState<Job | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const visibleCvs = useMemo(() => cvs.filter((cv) => {
    const job = jobFor(cv); const profile = profileFor(cv); const haystack = `${cv.file_name} ${job?.title ?? ""} ${profile?.full_name ?? ""} ${profile?.email ?? ""}`.toLowerCase();
    return (jobFilter === "all" || cv.job_id === jobFilter) && haystack.includes(search.toLowerCase());
  }), [cvs, search, jobFilter]);

  function resetForm() { setEditing(null); setTitle(""); setDescription(""); setSkills(""); }
  async function submitJob(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const body = { title, description, requiredSkills: skillsToArray(skills), isActive: editing?.is_active ?? true };
    const response = await fetch(editing ? `/api/jobs/${editing.id}` : "/api/jobs", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(payload.error ?? "Could not save the role."); return; }
    if (editing) setJobs((current) => current.map((job) => job.id === editing.id ? payload.job as Job : job)); else setJobs((current) => [payload.job as Job, ...current]);
    resetForm();
  }
  async function toggleJob(job: Job) {
    const response = await fetch(`/api/jobs/${job.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: job.title, description: job.description, requiredSkills: job.required_skills ?? [], isActive: !job.is_active }) });
    const payload = await response.json(); if (!response.ok) { setMessage(payload.error ?? "Could not update the role."); return; }
    setJobs((current) => current.map((item) => item.id === job.id ? payload.job as Job : item));
  }
  async function deleteJob(id: string) { if (!confirm("Delete this job posting? CVs will be unassigned.")) return; const response = await fetch(`/api/jobs/${id}`, { method: "DELETE" }); const payload = await response.json(); if (!response.ok) { setMessage(payload.error ?? "Could not delete the role."); return; } setJobs((current) => current.filter((job) => job.id !== id)); }
  async function deleteCv(id: string) { if (!confirm("Delete this CV and its associated data?")) return; const response = await fetch(`/api/cvs/${id}`, { method: "DELETE" }); const payload = await response.json(); if (!response.ok) { setMessage(payload.error ?? "Could not delete the CV."); return; } setCvs((current) => current.filter((cv) => cv.id !== id)); }
  async function evaluate(id: string) { const response = await fetch(`/api/cvs/${id}/evaluate`, { method: "POST" }); const payload = await response.json(); setMessage(response.ok ? "Evaluation started." : (payload.error ?? "Evaluation is unavailable.")); }

  return <div className="grid admin-workspace" style={{ gap: 24 }}>
    <section className="split"><form className="card card-pad form-grid" onSubmit={submitJob}><div><p className="eyebrow">Job management</p><h2 className="panel-title">{editing ? "Edit role" : "Create a new role"}</h2><p className="panel-note">Active jobs are immediately available to candidates.</p></div><div className="field"><label>Role title</label><input value={title} onChange={(e) => setTitle(e.target.value)} required /></div><div className="field"><label>Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} required /></div><div className="field"><label>Required skills</label><input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="TypeScript, React, PostgreSQL" /></div>{message && <div className="alert alert-info">{message}</div>}<div className="inline-actions"><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Create job"}</button>{editing && <button type="button" className="button button-secondary" onClick={resetForm}>Cancel</button>}</div></form>
      <div className="card"><div className="card-pad"><h2 className="panel-title">Job postings</h2><p className="panel-note">Create, refine, deactivate, or remove the roles candidates see.</p></div><div className="table-wrap"><table className="dense-table"><thead><tr><th>Role</th><th>Status</th><th>Skills</th><th /></tr></thead><tbody>{jobs.map((job) => <tr key={job.id}><td><strong>{job.title}</strong></td><td><span className={`chip ${job.is_active ? "chip-success" : ""}`}>{job.is_active ? "Active" : "Inactive"}</span></td><td>{job.required_skills?.slice(0, 3).join(", ") || "—"}</td><td><div className="inline-actions"><button className="button button-secondary button-small" onClick={() => { setEditing(job); setTitle(job.title); setDescription(job.description); setSkills((job.required_skills ?? []).join(", ")); }}>Edit</button><button className="button button-secondary button-small" onClick={() => toggleJob(job)}>{job.is_active ? "Deactivate" : "Activate"}</button><button className="button button-danger button-small" onClick={() => deleteJob(job.id)}>Delete</button></div></td></tr>)}</tbody></table></div></div></section>
    <section className="card application-ledger"><div className="card-pad"><div className="page-head" style={{ padding: 0 }}><div><p className="eyebrow">Screening queue</p><h2 className="panel-title" style={{ fontSize: 22 }}>Candidate CVs</h2><p className="panel-note">Compare application status and evaluation outcomes by role.</p></div><span className={`chip ${evaluationConfigured ? "chip-success" : "chip-warn"}`}>{evaluationConfigured ? "NIM ready" : "NIM key required"}</span></div><div className="grid grid-2" style={{ marginTop: 18 }}><div className="field"><label>Search candidate, email, file, or role</label><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search applications" /></div><div className="field"><label>Filter by role</label><select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)}><option value="all">All roles</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select></div></div></div>{visibleCvs.length === 0 ? <div className="empty empty-illustrated"><span className="empty-mark" aria-hidden>⌕</span><strong>No matching applications</strong><p>Adjust the queue filters or wait for candidates to submit a validated CV.</p></div> : <div className="table-wrap"><table className="dense-table admin-queue"><thead><tr><th>Candidate</th><th>CV / role</th><th>Status</th><th>Score</th><th>Actions</th></tr></thead><tbody>{visibleCvs.map((cv) => { const evaluation = cv.evaluations?.[0]; const profile = profileFor(cv); return <tr key={cv.id}><td><strong>{profile?.full_name || "Candidate"}</strong><div className="muted" style={{ marginTop: 4 }}>{profile?.email || "No email"}</div></td><td><strong>{cv.file_name}</strong><div className="muted" style={{ marginTop: 4 }}>{jobFor(cv)?.title || "Unassigned"}</div></td><td><StatusBadge status={cv.status} /></td><td>{evaluation ? <><strong>{evaluation.score}/100</strong><div className="muted" style={{ marginTop: 4 }}>{evaluation.matched_skills?.join(", ") || "No skill detail"}</div></> : "—"}</td><td><div className="inline-actions"><button className="button button-secondary button-small" disabled={cv.status !== "parsed"} onClick={() => evaluate(cv.id)}>Evaluate</button><button className="button button-danger button-small" onClick={() => deleteCv(cv.id)}>Delete</button></div></td></tr>; })}</tbody></table></div>}</section>
  </div>;
}
