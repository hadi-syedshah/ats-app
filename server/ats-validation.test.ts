import { describe, expect, it } from "vitest";
import { MAX_CV_BYTES, cleanStorageFilename, validateCvFile } from "../lib/ats/validation";

function file(name: string, type: string, bytes: number[]) {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("ATS CV upload validation", () => {
  it("accepts a PDF with the expected extension, MIME type, and signature", async () => {
    await expect(validateCvFile(file("candidate-cv.pdf", "application/pdf", [0x25, 0x50, 0x44, 0x46, 0x0a]))).resolves.toBeUndefined();
  });

  it("rejects a file whose PDF declaration does not match its binary signature", async () => {
    await expect(validateCvFile(file("candidate-cv.pdf", "application/pdf", [0x50, 0x4b, 0x03, 0x04]))).rejects.toThrow("signature");
  });

  it("preserves safe filename characters while normalizing an uploaded storage name", () => {
    expect(cleanStorageFilename("Ava Patel CV (final).pdf")).toBe("Ava_Patel_CV_final_.pdf");
  });

  it("keeps the enforced CV capacity at three megabytes", () => {
    expect(MAX_CV_BYTES).toBe(3 * 1024 * 1024);
  });
});
