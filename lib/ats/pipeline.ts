import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { evaluateCv } from "@/lib/ats/evaluate-cv";

export async function requestParser(cvId: string, filePath: string) {
  const parserUrl = env.parserServiceUrl();
  if (!parserUrl) return { started: false, reason: "Parser service is not configured." };

  const admin = createSupabaseAdminClient();
  const { data: signed, error: signedError } = await admin.storage.from("cvs").createSignedUrl(filePath, 300);
  if (signedError || !signed?.signedUrl) throw new Error("Could not create a signed CV URL for parsing.");

  await admin.from("cvs").update({ status: "parsing" }).eq("id", cvId);
  try {
    const response = await fetch(`${parserUrl}/parse`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": env.internalServiceSecret()
      },
      body: JSON.stringify({ cv_id: cvId, signed_url: signed.signedUrl })
    });
    if (!response.ok) throw new Error(`Parser service responded with ${response.status}.`);
    const parsed = await response.json().catch(() => null) as { status?: string } | null;
    if (parsed?.status === "parsed") {
      try {
        await evaluateCv(cvId, "automatic");
      } catch (error) {
        // evaluateCv persists the failed status; parsing and upload remain successful.
        console.error("Automatic CV evaluation failed", { cvId, error: error instanceof Error ? error.message : String(error) });
      }
    }
    return { started: true };
  } catch (error) {
    await admin.from("cvs").update({ status: "failed" }).eq("id", cvId);
    throw error;
  }
}
