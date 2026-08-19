import { afterEach, describe, expect, it, vi } from "vitest";

const createSignedUrl = vi.fn();
const statusUpdates: unknown[] = [];
const update = vi.fn((payload: unknown) => {
  statusUpdates.push(payload);
  return { eq: vi.fn().mockResolvedValue({ error: null }) };
});

vi.mock("@/lib/env", () => ({
  env: {
    parserServiceUrl: vi.fn(),
    internalServiceSecret: vi.fn()
  }
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    storage: { from: vi.fn(() => ({ createSignedUrl })) },
    from: vi.fn(() => ({ update }))
  }))
}));

import { env } from "@/lib/env";
import { requestParser } from "@/lib/ats/pipeline";

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  statusUpdates.length = 0;
});

describe("parser orchestration", () => {
  it("does not attempt an upload transition when the parser URL is not configured", async () => {
    vi.mocked(env.parserServiceUrl).mockReturnValue("");

    await expect(requestParser("cv-1", "candidate-1/resume.pdf")).resolves.toEqual({ started: false, reason: "Parser service is not configured." });
    expect(update).not.toHaveBeenCalled();
  });

  it("creates a signed URL, marks parsing, and sends the protected parser request", async () => {
    vi.mocked(env.parserServiceUrl).mockReturnValue("https://parser.example.test");
    vi.mocked(env.internalServiceSecret).mockReturnValue("internal-secret");
    createSignedUrl.mockResolvedValue({ data: { signedUrl: "https://storage.example.test/signed.pdf" }, error: null });
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(requestParser("cv-1", "candidate-1/resume.pdf")).resolves.toEqual({ started: true });
    expect(createSignedUrl).toHaveBeenCalledWith("candidate-1/resume.pdf", 300);
    expect(statusUpdates).toEqual([{ status: "parsing" }]);
    expect(fetchMock).toHaveBeenCalledWith("https://parser.example.test/parse", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({ "X-Internal-Secret": "internal-secret" }),
      body: JSON.stringify({ cv_id: "cv-1", signed_url: "https://storage.example.test/signed.pdf" })
    }));
  });
});
