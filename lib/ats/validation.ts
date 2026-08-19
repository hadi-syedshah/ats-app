import { z } from "zod";

export const MAX_CV_BYTES = 3 * 1024 * 1024;
export const ACCEPTED_CV_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] as const;
export const ACCEPTED_CV_EXTENSIONS = ["pdf", "docx"] as const;

export const jobInputSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(12000),
  requiredSkills: z.array(z.string().trim().min(1).max(80)).max(40),
  isActive: z.boolean().default(true)
});

export async function validateCvFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !ACCEPTED_CV_EXTENSIONS.includes(extension as (typeof ACCEPTED_CV_EXTENSIONS)[number])) {
    throw new Error("Only PDF and DOCX resumes are accepted.");
  }
  if (!ACCEPTED_CV_TYPES.includes(file.type as (typeof ACCEPTED_CV_TYPES)[number])) {
    throw new Error("The uploaded file has an unsupported content type.");
  }
  if (file.size === 0 || file.size > MAX_CV_BYTES) {
    throw new Error("Each CV must be larger than 0 bytes and no more than 3 MB.");
  }

  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const isPdf = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
  const isZip = header[0] === 0x50 && header[1] === 0x4b;
  if ((extension === "pdf" && !isPdf) || (extension === "docx" && !isZip)) {
    throw new Error("The file signature does not match its declared CV format.");
  }
}

export function cleanStorageFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_").slice(0, 150);
}
