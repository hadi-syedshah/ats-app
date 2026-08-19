import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ats/auth", () => ({ getAuthContext: vi.fn() }));

import { getAuthContext } from "@/lib/ats/auth";
import { requireApiAdmin, requireApiUser } from "@/lib/ats/api-auth";

const authContext = {
  userId: "candidate-1",
  email: "candidate@example.test",
  profile: { id: "candidate-1", email: "candidate@example.test", full_name: "Candidate", role: "candidate" as const, created_at: "2026-08-19T00:00:00Z" }
};

afterEach(() => vi.resetAllMocks());

describe("ATS API role guards", () => {
  it("returns 401 when an API request has no authenticated profile", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(null);

    const result = await requireApiUser();

    expect(result.context).toBeNull();
    expect(result.response?.status).toBe(401);
    await expect(result.response?.json()).resolves.toEqual({ error: "Authentication is required." });
  });

  it("returns 403 when a candidate reaches an administrator action", async () => {
    vi.mocked(getAuthContext).mockResolvedValue(authContext);

    const result = await requireApiAdmin();

    expect(result.context).toBeNull();
    expect(result.response?.status).toBe(403);
    await expect(result.response?.json()).resolves.toEqual({ error: "Administrator access is required." });
  });

  it("passes an administrator context through the guard", async () => {
    const admin = { ...authContext, profile: { ...authContext.profile, role: "admin" as const } };
    vi.mocked(getAuthContext).mockResolvedValue(admin);

    await expect(requireApiAdmin()).resolves.toEqual({ context: admin, response: null });
  });
});
