import { Brand } from "@/components/brand";
import { SignOutButton } from "@/components/sign-out-button";

export function Topbar({ role }: { role?: "candidate" | "admin" }) {
  return <header className="topbar"><div className="container topbar-inner"><Brand /><div className="inline-actions">{role && <span className="chip">{role === "admin" ? "Admin workspace" : "Candidate workspace"}</span>}<SignOutButton /></div></div></header>;
}
