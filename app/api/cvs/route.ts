import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/ats/api-auth";
import { cleanStorageFilename, validateCvFile } from "@/lib/ats/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requestParser } from "@/lib/ats/pipeline";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { context, response } = await requireApiUser();
  if (response || !context) return response!;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const jobId = String(formData.get("jobId") ?? "");
    if (!(file instanceof File)) return NextResponse.json({ error: "A CV file is required." }, { status: 400 });
    if (!jobId) return NextResponse.json({ error: "Please choose the job this CV is being submitted for." }, { status: 400 });
    await validateCvFile(file);

    const admin = createSupabaseAdminClient();
    const { count, error: countError } = await admin
      .from("cvs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId);
    if (countError) throw countError;
    if ((count ?? 0) >= 3) return NextResponse.json({ error: "You can keep a maximum of three CVs." }, { status: 409 });

    const { data: job, error: jobError } = await admin
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .eq("is_active", true)
      .maybeSingle();
    if (jobError || !job) return NextResponse.json({ error: "The selected job is no longer accepting applications." }, { status: 400 });

    const storagePath = `${context.userId}/${Date.now()}-${cleanStorageFilename(file.name)}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage.from("cvs").upload(storagePath, bytes, {
      contentType: file.type,
      upsert: false
    });
    if (uploadError) throw uploadError;

    const { data: cv, error: cvError } = await admin
      .from("cvs")
      .insert({
        user_id: context.userId,
        job_id: jobId,
        file_url: storagePath,
        file_name: file.name,
        file_size_bytes: file.size,
        status: "uploaded"
      })
      .select("id,status")
      .single();
    if (cvError || !cv) {
      await admin.storage.from("cvs").remove([storagePath]);
      throw cvError ?? new Error("The CV record could not be created.");
    }

    const cvId = String(cv.id);
    let parserMessage = "Upload is complete and queued for parsing.";
    try {
      const parser = await requestParser(cvId, storagePath);
      if (!parser.started) parserMessage = parser.reason ?? parserMessage;
    } catch {
      parserMessage = "Upload succeeded, but parsing failed. The CV is marked as failed.";
    }

    return NextResponse.json({ cvId, message: parserMessage }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The CV could not be uploaded.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
