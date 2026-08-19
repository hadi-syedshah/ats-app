import { afterEach, describe, expect, it, vi } from "vitest";

const admin = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ count: 3, error: null }) }))
  })),
  storage: { from: vi.fn() }
};

vi.mock("@/lib/ats/api-auth", () => ({
  requireApiUser: vi.fn().mockResolvedValue({
    context: { userId: "candidate-1", email: "candidate@example.test", profile: { id: "candidate-1", email: "candidate@example.test", full_name: "Candidate", role: "candidate", created_at: "2026-08-19T00:00:00Z" } },
    response: null
  })
}));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: vi.fn(() => admin) }));
vi.mock("@/lib/ats/pipeline", () => ({ requestParser: vi.fn() }));

import { POST } from "@/app/api/cvs/route";

afterEach(() => vi.clearAllMocks());

describe("three-CV server limit", () => {
  it("rejects a validated fourth CV before touching Storage", async () => {
    const form = new FormData();
    form.set("jobId", "11111111-1111-1111-1111-111111111111");
    form.set("file", new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x0a])], "candidate.pdf", { type: "application/pdf" }));

    const response = await POST(new Request("http://localhost/api/cvs", { method: "POST", body: form }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({ error: "You can keep a maximum of three CVs." });
    expect(admin.storage.from).not.toHaveBeenCalled();
  });
});
