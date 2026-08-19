import { redirect } from "next/navigation";

/** Managed preview compatibility route; the ATS entry point is the root page. */
export default function DashboardCompatibilityRoute() {
  redirect("/");
}
