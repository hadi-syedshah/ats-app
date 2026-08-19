import { createClient } from "@supabase/supabase-js";

const apiBase = process.env.ATS_LOCAL_APP_URL ?? "http://127.0.0.1:3000";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

for (const [name, value] of Object.entries({ supabaseUrl, anonKey, serviceRoleKey, parser: process.env.PARSER_SERVICE_URL, nim: process.env.NVIDIA_NIM_API_KEY })) {
  if (!value) throw new Error(`${name} is required for the live end-to-end test.`);
}

const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const candidateEmail = `ats.e2e.candidate.${suffix}@example.test`;
const adminEmail = `ats.e2e.admin.${suffix}@example.test`;
const password = "End2End!Passphrase2026";
const created = { candidateId: null, adminId: null, storagePath: null, cvId: null };
let phase = "setup";

function testResumePdf() {
  const text = [
    "Casey Example — Software Engineer",
    "Email: casey.example@example.test | Phone: +1 555 010 2026",
    "Skills: TypeScript, React, Node.js, PostgreSQL, Python, Docker, AWS, REST APIs",
    "Experience: Software Engineer — Built production TypeScript services and React applications.",
    "Education: BSc Computer Science"
  ];
  const stream = ["BT", "/F1 12 Tf", "72 760 Td"];
  text.forEach((line, index) => {
    if (index) stream.push("0 -20 Td");
    stream.push(`(${line.replace(/[()\\]/g, "\\$&")}) Tj`);
  });
  stream.push("ET");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(stream.join("\n"), "binary")} >>\nstream\n${stream.join("\n")}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "binary"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Uint8Array(Buffer.from(pdf, "binary"));
}

async function createUser(email, role) {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: role === "admin" ? "E2E Hiring Admin" : "E2E Candidate" } });
  if (error || !data.user) throw error ?? new Error("Unable to create test user.");
  await admin.from("profiles").upsert({ id: data.user.id, email, full_name: role === "admin" ? "E2E Hiring Admin" : "E2E Candidate", role });
  return data.user.id;
}

async function authenticatedCookie(email) {
  const client = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw error ?? new Error("Unable to create test session.");
  const encoded = Buffer.from(JSON.stringify(data.session)).toString("base64url");
  return `sb-${projectRef}-auth-token=base64-${encoded}`;
}

async function waitForCv(cvId, target) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const { data, error } = await admin.from("cvs").select("status").eq("id", cvId).single();
    if (error) throw error;
    if (data.status === target) return;
    if (data.status === "failed") throw new Error(`CV entered failed status while waiting for ${target}.`);
    await new Promise((resolve) => setTimeout(resolve, 1_500));
  }
  throw new Error(`Timed out waiting for CV status ${target}.`);
}

async function cleanup() {
  if (created.storagePath) await admin.storage.from("cvs").remove([created.storagePath]);
  if (created.cvId) await admin.from("cvs").delete().eq("id", created.cvId);
  if (created.candidateId) await admin.auth.admin.deleteUser(created.candidateId);
  if (created.adminId) await admin.auth.admin.deleteUser(created.adminId);
}

try {
  phase = "create users";
  created.candidateId = await createUser(candidateEmail, "candidate");
  created.adminId = await createUser(adminEmail, "admin");
  phase = "select job";
  const { data: job, error: jobError } = await admin.from("jobs").select("id,title").eq("is_active", true).order("created_at").limit(1).single();
  if (jobError || !job) throw jobError ?? new Error("No active job exists for the end-to-end test.");

  phase = "upload CV";
  const candidateCookie = await authenticatedCookie(candidateEmail);
  const resumeBytes = testResumePdf();
  const form = new FormData();
  form.set("jobId", job.id);
  form.set("file", new File([resumeBytes], "casey-example-resume.pdf", { type: "application/pdf" }));
  const uploadResponse = await fetch(`${apiBase}/api/cvs`, { method: "POST", headers: { Cookie: candidateCookie }, body: form });
  const uploadBody = await uploadResponse.json();
  if (!uploadResponse.ok || !uploadBody.cvId) throw new Error(`Upload failed (${uploadResponse.status}): ${JSON.stringify(uploadBody)}`);
  created.cvId = uploadBody.cvId;
  const { data: uploaded } = await admin.from("cvs").select("file_url").eq("id", created.cvId).single();
  created.storagePath = uploaded?.file_url ?? null;
  console.log(JSON.stringify({ phase, cv_id: created.cvId, upload_status: "created" }));

  phase = "wait for parsing";
  await waitForCv(created.cvId, "parsed");
  console.log(JSON.stringify({ phase, cv_id: created.cvId, status: "parsed" }));
  phase = "verify parsed data";
  const { data: parsed, error: parsedError } = await admin.from("parsed_data").select("name,email,skills,raw_text").eq("cv_id", created.cvId).single();
  if (parsedError || !parsed?.raw_text || !parsed.skills?.length) throw parsedError ?? new Error("Parsed CV data is incomplete.");
  console.log(JSON.stringify({ phase, cv_id: created.cvId, parsed: { name: parsed.name, email: parsed.email, skill_count: parsed.skills.length } }));

  phase = "request evaluation";
  const adminCookie = await authenticatedCookie(adminEmail);
  const evaluateResponse = await fetch(`${apiBase}/api/cvs/${created.cvId}/evaluate`, { method: "POST", headers: { Cookie: adminCookie } });
  const evaluateBody = await evaluateResponse.json();
  if (!evaluateResponse.ok || typeof evaluateBody.evaluation?.score !== "number") throw new Error(`Evaluation failed (${evaluateResponse.status}): ${JSON.stringify(evaluateBody)}`);
  phase = "wait for evaluation";
  await waitForCv(created.cvId, "evaluated");
  console.log(JSON.stringify({ phase, cv_id: created.cvId, status: "evaluated" }));
  phase = "verify evaluation persistence";
  const { data: evaluation, error: evaluationError } = await admin.from("evaluations").select("score,matched_skills,missing_skills,feedback,model_used").eq("cv_id", created.cvId).single();
  if (evaluationError || !evaluation) throw evaluationError ?? new Error("Evaluation was not persisted.");

  console.log(JSON.stringify({
    candidate: candidateEmail,
    cv_id: created.cvId,
    job: job.title,
    parsed: { name: parsed.name, email: parsed.email, skill_count: parsed.skills.length },
    evaluation
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    phase,
    cv_id: created.cvId,
    error: error instanceof Error ? error.message : String(error),
    cleanup: "will run in finally"
  }, null, 2));
  throw error;
} finally {
  await cleanup();
}
