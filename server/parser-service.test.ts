import { describe, expect, it } from "vitest";

describe("parser service configuration", () => {
  it("reaches the configured local parser health endpoint", async () => {
    const baseUrl = process.env.PARSER_SERVICE_URL;
    expect(baseUrl).toBeTruthy();
    const response = await fetch(`${baseUrl?.replace(/\/$/, "")}/health`, { signal: AbortSignal.timeout(10_000) });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  }, 15_000);
});
