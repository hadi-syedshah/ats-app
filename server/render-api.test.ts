import { describe, expect, it } from "vitest";

const renderApiKey = process.env.RENDER_API_KEY;
const credentialCheck = renderApiKey ? it : it.skip;

describe("Render deployment credential", () => {
  credentialCheck("can list the account owners through Render's read-only API", async () => {
    const response = await fetch("https://api.render.com/v1/owners", {
      headers: { Authorization: `Bearer ${renderApiKey}` }
    });

    expect(response.status).toBe(200);
    const owners = await response.json() as unknown;
    expect(Array.isArray(owners)).toBe(true);
  }, 20_000);
});
