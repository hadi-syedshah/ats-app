export type Role = "candidate" | "admin";

export type CvStatus =
  | "uploaded"
  | "parsing"
  | "parsed"
  | "evaluating"
  | "evaluated"
  | "failed";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  required_skills: string[] | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface ParsedData {
  cv_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  skills: string[] | null;
  education: unknown;
  experience: unknown;
  raw_text: string | null;
  parsed_at: string;
}

export interface Evaluation {
  id: string;
  cv_id: string;
  user_id: string;
  job_id: string | null;
  score: number;
  matched_skills: string[] | null;
  missing_skills: string[] | null;
  feedback: string | null;
  model_used: string | null;
  created_at: string;
}

export interface Cv {
  id: string;
  user_id: string;
  job_id: string | null;
  file_url: string;
  file_name: string;
  file_size_bytes: number;
  status: CvStatus;
  parsed_text: string | null;
  uploaded_at: string;
  jobs?: Pick<Job, "id" | "title"> | null;
  parsed_data?: ParsedData | null;
  evaluations?: Evaluation[] | null;
  profiles?: Pick<Profile, "email" | "full_name"> | null;
}

export interface AuthContext {
  userId: string;
  email: string | null;
  profile: Profile;
}
