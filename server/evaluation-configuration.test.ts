import { afterEach, describe, expect, it, vi } from "vitest";
import { evaluationConfiguration } from "@/lib/ats/evaluation";

afterEach(() => vi.unstubAllEnvs());

describe("NVIDIA NIM evaluation configuration", () => {
  it("keeps evaluation disabled until a key is actually supplied", () => {
    vi.stubEnv("NVIDIA_NIM_API_KEY", "");
    expect(evaluationConfiguration()).toEqual({ configured: false, message: "NVIDIA NIM evaluation is disabled until NVIDIA_NIM_API_KEY is supplied." });
  });

  it("reports the integration as ready when a key is supplied", () => {
    vi.stubEnv("NVIDIA_NIM_API_KEY", "real-key-provided-at-runtime");
    expect(evaluationConfiguration()).toEqual({ configured: true, message: "Evaluation integration is configured." });
  });
});
