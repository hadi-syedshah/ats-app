import type { CvStatus } from "@/lib/ats/types";

const labels: Record<CvStatus, string> = {
  uploaded: "Uploaded",
  parsing: "Parsing",
  parsed: "Parsed",
  evaluating: "Evaluating",
  evaluated: "Evaluated",
  failed: "Needs attention"
};

export function StatusBadge({ status }: { status: CvStatus }) {
  const className = status === "evaluated" ? "chip-success" : status === "failed" ? "chip-fail" : status === "uploaded" || status === "parsing" || status === "evaluating" ? "chip-warn" : "";
  return <span className={`chip ${className}`}>{labels[status]}</span>;
}
