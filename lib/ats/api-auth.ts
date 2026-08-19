import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/ats/auth";

export async function requireApiUser() {
  const context = await getAuthContext();
  if (!context) {
    return { context: null, response: NextResponse.json({ error: "Authentication is required." }, { status: 401 }) };
  }
  return { context, response: null };
}

export async function requireApiAdmin() {
  const result = await requireApiUser();
  if (result.response || !result.context) return result;
  if (result.context.profile.role !== "admin") {
    return { context: null, response: NextResponse.json({ error: "Administrator access is required." }, { status: 403 }) };
  }
  return result;
}
