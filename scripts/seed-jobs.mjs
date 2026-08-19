import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to seed jobs.");
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const jobs = [
  {
    title: "Software Engineer",
    description: "Build reliable product features across a modern web application, collaborating with product and design to deliver secure, maintainable customer experiences.",
    required_skills: ["TypeScript", "React", "Node.js", "SQL", "Git"],
    is_active: true
  },
  {
    title: "Product Manager",
    description: "Lead discovery and delivery for a customer-facing product area, translating research into prioritized, measurable product outcomes.",
    required_skills: ["Product strategy", "User research", "Roadmapping", "Analytics", "Stakeholder management"],
    is_active: true
  }
];

const { data: existing, error: existingError } = await supabase.from("jobs").select("title").in("title", jobs.map((job) => job.title));
if (existingError) throw existingError;
const titles = new Set((existing ?? []).map((job) => job.title));
const missing = jobs.filter((job) => !titles.has(job.title));

if (missing.length) {
  const { error } = await supabase.from("jobs").insert(missing);
  if (error) throw error;
}

console.log(`Seed complete: ${missing.length} job${missing.length === 1 ? "" : "s"} created; ${jobs.length - missing.length} already present.`);
