import { describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = url?.replace(/\/?rest\/v1\/?$/, "").replace(/\/$/, "");
const credentialCheck = baseUrl && serviceRoleKey ? it : it.skip;

describe("Supabase parser credentials", () => {
  credentialCheck("can make a read-only request to the ATS jobs table", async () => {
    const response = await fetch(`${baseUrl}/rest/v1/jobs?select=id&limit=1`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    expect(response.status).toBe(200);
    const result = await response.json() as unknown;
    expect(Array.isArray(result)).toBe(true);
  }, 20_000);
});
