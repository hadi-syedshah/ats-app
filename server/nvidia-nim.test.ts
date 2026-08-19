import { describe, expect, it } from "vitest";

describe("NVIDIA NIM credential", () => {
  it("authorizes a lightweight models request", async () => {
    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    expect(apiKey).toBeTruthy();

    const response = await fetch("https://integrate.api.nvidia.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      signal: AbortSignal.timeout(30_000)
    });

    expect(response.status, await response.text()).toBe(200);
  }, 40_000);
});
