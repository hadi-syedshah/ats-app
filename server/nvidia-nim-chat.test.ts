import { describe, expect, it } from "vitest";

describe("NVIDIA NIM chat completions", () => {
  it("returns a short completion from the configured evaluation model", async () => {
    const apiKey = process.env.NVIDIA_NIM_API_KEY;
    const model = process.env.NVIDIA_NIM_MODEL || "meta/llama-3.1-8b-instruct";
    expect(apiKey).toBeTruthy();
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, max_tokens: 20, temperature: 0, messages: [{ role: "user", content: "Reply with the word ready." }] }),
      signal: AbortSignal.timeout(60_000)
    });
    expect(response.status, await response.text()).toBe(200);
  }, 70_000);
});
