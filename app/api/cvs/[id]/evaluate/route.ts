import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/ats/api-auth";
import { evaluateCv } from "@/lib/ats/evaluate-cv";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireApiAdmin();
  if (response) return response;
  const { id } = await params;
  try {
    const result = await evaluateCv(id, "manual");
    if (result.state === "skipped") return NextResponse.json({ error: result.reason }, { status: 409 });
    return NextResponse.json({ evaluation: result.evaluation }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Evaluation failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
