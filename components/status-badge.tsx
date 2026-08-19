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
  return <span className={`chip status-badge status-${status}`}><span className="status-pulse" aria-hidden />{labels[status]}</span>;
}
