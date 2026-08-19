import { describe, expect, it } from "vitest";
import { extractEvaluation } from "./evaluation";

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
});
