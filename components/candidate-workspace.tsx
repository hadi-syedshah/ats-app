"use client";

import { useEffect, useMemo, useState } from "react";
import type { Cv, CvStatus, Job } from "@/lib/ats/types";
import { MAX_CV_BYTES } from "@/lib/ats/validation";
import { StatusBadge } from "@/components/status-badge";

type CandidateWorkspaceProps = { jobs: Job[]; initialCvs: Cv[] };

function jobFor(cv: Cv) { return Array.isArray(cv.jobs) ? cv.jobs[0] : cv.jobs; }
function evaluationFor(cv: Cv) { return cv.evaluations?.[0] ?? null; }
function date(value: string) { return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
function size(value: number) { return `${(value / 1024 / 1024).toFixed(1)} MB`; }

export function CandidateWorkspace({ jobs, initialCvs }: CandidateWorkspaceProps) {
  const [cvs, setCvs] = useState(initialCvs);
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const canUpload = cvs.length < 3 && jobs.length > 0;

  useEffect(() => {
    const refresh = async () => {
      const response = await fetch("/api/status", { cache: "no-store" });
      if (response.ok) { const data = await response.json(); setCvs(data.cvs as Cv[]); }
    };
    const timer = window.setInterval(refresh, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const summary = useMemo(() => ({ parsed: cvs.filter((cv) => cv.status === "parsed").length, evaluated: cvs.filter((cv) => cv.status === "evaluated").length }), [cvs]);

  async function upload(event: React.FormEvent) {
    event.preventDefault(); setMessage("");
    if (!file || !jobId) { setMessage("Choose a job and a PDF or DOCX file first."); return; }
    if (file.size > MAX_CV_BYTES) { setMessage("The selected file is larger than 3 MB."); return; }
    setBusy(true);
    const data = new FormData(); data.set("file", file); data.set("jobId", jobId);
    const response = await fetch("/api/cvs", { method: "POST", body: data });
    const payload = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(payload.error ?? "Upload failed."); return; }
    setMessage(payload.message); setFile(null);
    const refresh = await fetch("/api/status", { cache: "no-store" });
    if (refresh.ok) setCvs((await refresh.json()).cvs as Cv[]);
  }

  async function remove(id: string) {
    if (!confirm("Delete this CV and its processing data?")) return;
    const response = await fetch(`/api/cvs/${id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) { setMessage(payload.error ?? "Could not delete the CV."); return; }
    setCvs((current) => current.filter((cv) => cv.id !== id));
  }

  return <div className="grid" style={{ gap: 24 }}>
    <section className="grid grid-3"><div className="card card-pad"><p className="stat-label">CV slots used</p><p className="stat-value">{cvs.length}<span className="muted" style={{ fontSize: 18 }}> / 3</span></p></div><div className="card card-pad"><p className="stat-label">Parsed applications</p><p className="stat-value">{summary.parsed}</p></div><div className="card card-pad"><p className="stat-label">Evaluated applications</p><p className="stat-value">{summary.evaluated}</p></div></section>
    <section className="split"><form className="card card-pad form-grid" onSubmit={upload}><div><h2 className="panel-title">Submit a CV</h2><p className="panel-note">PDF or DOCX, up to 3 MB. Each submission is matched to a role before it enters screening.</p></div><div className="field"><label htmlFor="job">Role</label><select id="job" value={jobId} onChange={(e) => setJobId(e.target.value)} disabled={!canUpload}><option value="">Choose a role</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select></div><div className="field"><label htmlFor="cv">CV file</label><input id="cv" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={!canUpload} /></div>{message && <div className="alert alert-info">{message}</div>}<button className="button button-primary" disabled={!canUpload || busy}>{busy ? "Uploading…" : canUpload ? "Upload and start parsing" : "CV limit reached"}</button></form>
      <div className="grid grid-2">{jobs.map((job) => <article className="card job-card" key={job.id}><div><p className="eyebrow">Open role</p><h3>{job.title}</h3></div><p>{job.description}</p><div className="skills">{job.required_skills?.slice(0, 5).map((skill) => <span className="skill" key={skill}>{skill}</span>)}</div></article>)}{jobs.length === 0 && <div className="card empty">There are no active job postings right now.</div>}</div></section>
    <section className="card"><div className="card-pad"><h2 className="panel-title">My applications</h2><p className="panel-note">This view checks for status changes every five seconds.</p></div>{cvs.length === 0 ? <div className="empty">No CVs yet. Choose a role above to get started.</div> : <div className="table-wrap"><table><thead><tr><th>CV</th><th>Role</th><th>Status</th><th>Submitted</th><th>Result</th><th /></tr></thead><tbody>{cvs.map((cv) => { const evaluation = evaluationFor(cv); return <tr key={cv.id}><td><strong>{cv.file_name}</strong><div className="muted" style={{ marginTop: 4 }}>{size(cv.file_size_bytes)}</div></td><td>{jobFor(cv)?.title ?? "General application"}</td><td><StatusBadge status={cv.status as CvStatus} /></td><td>{date(cv.uploaded_at)}</td><td>{evaluation ? <div><strong>{evaluation.score}/100</strong><div className="muted" style={{ maxWidth: 300, marginTop: 4 }}>{evaluation.feedback || "Evaluation complete"}</div></div> : <span className="muted">Awaiting evaluation</span>}</td><td><button className="button button-danger button-small" onClick={() => remove(cv.id)}>Delete</button></td></tr>; })}</tbody></table></div>}</section>
  </div>;
}
