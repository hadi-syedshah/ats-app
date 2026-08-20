import { afterEach, describe, expect, it, vi } from "vitest";
import { buildNimEvaluationPrompt, compareJobRequirements, constrainScoreToRequirementCoverage, evaluateWithNim, extractEvaluation } from "./evaluation";

const input = {
  job: { title: "Engineer", description: "Build services", requiredSkills: ["TypeScript"] },
  candidate: { name: "Casey", skills: ["TypeScript"], rawText: "TypeScript engineer" }
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("extractEvaluation", () => {
  it("normalizes a fenced NIM JSON response", () => {
    expect(extractEvaluation("```json\n{\"score\": 91.4, \"matched_skills\": [\"TypeScript\", \"typescript\"], \"missing_skills\": [\"Kubernetes\"], \"feedback\": \"Strong match.\"}\n```")).toEqual({
      score: 91,
      matched_skills: ["TypeScript"],
      missing_skills: ["Kubernetes"],
      feedback: "Strong match."
    });
  });

  it("rejects a response that does not contain a JSON object", () => {
    expect(() => extractEvaluation("I cannot evaluate this CV.")).toThrow("did not return a JSON evaluation");
  });

  it("derives matched and missing skills from the explicit required-skills list and caps an inflated mismatch score", () => {
    const comparison = compareJobRequirements(["Python", "FastAPI", "SQL", "Kubernetes", "Terraform"], ["Python", "FastAPI", "SQL"]);
    expect(comparison).toMatchObject({ matchedSkills: ["Python", "FastAPI", "SQL"], missingSkills: ["Kubernetes", "Terraform"], coverage: 0.6 });
    expect(constrainScoreToRequirementCoverage(96, comparison)).toBe(72);
    expect(extractEvaluation(JSON.stringify({ score: 96, matched_skills: ["invented"], missing_skills: [], feedback: "Some overlap." }), comparison)).toMatchObject({ score: 72, matched_skills: ["Python", "FastAPI", "SQL"], missing_skills: ["Kubernetes", "Terraform"] });
  });

  it("builds a strict prompt with deterministic job-requirement evidence", () => {
    const prompt = buildNimEvaluationPrompt({ job: { title: "Platform Engineer", description: "Operate Kubernetes", requiredSkills: ["Kubernetes", "Terraform"] }, candidate: { skills: ["Kubernetes"] } });
    expect(prompt.messages[0].content).toContain("penalize missing core requirements materially");
    expect(prompt.messages[1].content).toContain("missing_required_skills");
    expect(prompt.requirementComparison).toMatchObject({ matchedSkills: ["Kubernetes"], missingSkills: ["Terraform"] });
  });

  it("retries transient NIM 451 responses before accepting a later chat completion", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("regional gate", { status: 451, statusText: "Unavailable For Legal Reasons" }))
      .mockResolvedValueOnce(new Response("temporarily unavailable", { status: 503, statusText: "Service Unavailable" }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ score: 84, matched_skills: ["TypeScript"], missing_skills: [], feedback: "Good fit." }) } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const originalKey = process.env.NVIDIA_NIM_API_KEY;
    process.env.NVIDIA_NIM_API_KEY = "test-key";

    try {
      await expect(evaluateWithNim(input)).resolves.toMatchObject({ score: 84, matched_skills: ["TypeScript"] });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    } finally {
      process.env.NVIDIA_NIM_API_KEY = originalKey;
    }
  }, 5_000);
});
