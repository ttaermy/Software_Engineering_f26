import { describe, it, expect } from "vitest";
import {
  validateExplanationInput,
  validateExplanationText,
  mockExplainAdapter,
  buildFallbackText,
  explainAvailability,
  countSentences,
  MAX_SENTENCES,
  type ExplanationInput,
} from "./explanation";

const validInput: ExplanationInput = {
  roomName: "Library Study Room 204",
  startTime: "11:00 AM",
  endTime: "12:00 PM",
  status: "unavailable",
  reasonCode: "overlap",
  reason: "Overlaps an existing booking (9:00 AM – 10:00 AM)",
};

describe("validateExplanationInput", () => {
  it("accepts a well-formed input", () => {
    expect(validateExplanationInput(validInput)).toEqual(validInput);
  });

  it("rejects non-object and null input", () => {
    expect(validateExplanationInput(null)).toBeNull();
    expect(validateExplanationInput("text")).toBeNull();
    expect(validateExplanationInput(42)).toBeNull();
  });

  it("rejects empty required fields", () => {
    expect(validateExplanationInput({ ...validInput, roomName: "" })).toBeNull();
    expect(validateExplanationInput({ ...validInput, startTime: "" })).toBeNull();
    expect(validateExplanationInput({ ...validInput, reasonCode: "  " })).toBeNull();
  });

  it("rejects invalid status values", () => {
    expect(validateExplanationInput({ ...validInput, status: "maybe" })).toBeNull();
    expect(validateExplanationInput({ ...validInput, status: 1 })).toBeNull();
  });

  it("rejects excessively long fields", () => {
    expect(
      validateExplanationInput({ ...validInput, roomName: "R".repeat(101) }),
    ).toBeNull();
    expect(
      validateExplanationInput({ ...validInput, reason: "x".repeat(301) }),
    ).toBeNull();
    expect(
      validateExplanationInput({ ...validInput, reasonCode: "c".repeat(51) }),
    ).toBeNull();
  });

  it("rejects malformed reason codes", () => {
    expect(
      validateExplanationInput({ ...validInput, reasonCode: "bad code!" }),
    ).toBeNull();
    expect(
      validateExplanationInput({ ...validInput, reasonCode: "new\nline" }),
    ).toBeNull();
  });

  it("rejects malformed time fields", () => {
    expect(validateExplanationInput({ ...validInput, startTime: 900 })).toBeNull();
    expect(validateExplanationInput({ ...validInput, endTime: null })).toBeNull();
  });

  it("accepts all time formats parseTimeInput supports", () => {
    for (const t of ["10:30", "10:30 AM", "9:00am", "2:45 pm", "00:00", "23:59"])
      expect(validateExplanationInput({ ...validInput, startTime: t, endTime: t })).not.toBeNull();
  });

  it("rejects time strings parseTimeInput would reject", () => {
    for (const t of ["25:00", "12:60", "9 AM", ":30", "abc", "10:30:00", "10-30"])
      expect(validateExplanationInput({ ...validInput, startTime: t })).toBeNull();
    expect(validateExplanationInput({ ...validInput, endTime: "12:xx" })).toBeNull();
  });
});

describe("validateExplanationText", () => {
  it("accepts text within the sentence and length limits", () => {
    expect(validateExplanationText("One sentence here. And a second one."))
      .toBe("One sentence here. And a second one.");
  });

  it("rejects empty, non-string, and too-long text", () => {
    expect(validateExplanationText("")).toBeNull();
    expect(validateExplanationText("   ")).toBeNull();
    expect(validateExplanationText(123)).toBeNull();
    expect(validateExplanationText("x".repeat(501))).toBeNull();
  });

  it("rejects text with more than two sentences", () => {
    expect(validateExplanationText("One. Two. Three.")).toBeNull();
  });

  it("accepts exactly two sentences", () => {
    expect(countSentences("One. Two.")).toBe(MAX_SENTENCES);
    expect(validateExplanationText("One. Two.")).not.toBeNull();
  });
});

describe("mockExplainAdapter", () => {
  it("produces at most two sentences for an available slot", () => {
    const text = mockExplainAdapter({
      ...validInput,
      status: "available",
      reason: undefined,
    });
    expect(countSentences(text)).toBeLessThanOrEqual(MAX_SENTENCES);
    expect(text).toContain("is open between");
  });

  it("produces at most two sentences for an unavailable slot", () => {
    const text = mockExplainAdapter(validInput);
    expect(countSentences(text)).toBeLessThanOrEqual(MAX_SENTENCES);
    expect(text).toContain("is not available between");
  });

  it("sanitizes embedded terminators in the reason fragment", () => {
    const text = mockExplainAdapter({
      ...validInput,
      reason: "Overlaps booking at 9:00 AM. Also busy!",
    });
    expect(countSentences(text)).toBeLessThanOrEqual(MAX_SENTENCES);
    expect(text).not.toContain("AM.");
    expect(text).toContain("AM,");
  });
});

describe("explainAvailability", () => {
  it("returns the mock output for valid input and a working adapter", () => {
    const result = explainAvailability(validInput);
    expect(result.source).toBe("mock");
    expect(countSentences(result.text)).toBeLessThanOrEqual(MAX_SENTENCES);
  });

  it("falls back deterministically when the adapter throws", () => {
    const result = explainAvailability(validInput, () => {
      throw new Error("mock service down");
    });
    expect(result.source).toBe("fallback");
    expect(result.text).toBe(buildFallbackText(validInput));
  });

  it("falls back when the adapter returns invalid output", () => {
    const result = explainAvailability(validInput, () => "");
    expect(result.source).toBe("fallback");

    const tooLong = explainAvailability(validInput, () =>
      "Sentence one. Sentence two. Sentence three.",
    );
    expect(tooLong.source).toBe("fallback");
  });

  it("falls back with a generic message when the input is invalid", () => {
    const result = explainAvailability({ status: "nope" });
    expect(result.source).toBe("fallback");
    expect(result.text).toBe("Explanation is unavailable for this request.");
  });

  it("fallback text is derived only from the authoritative availability result", () => {
    const fallback = buildFallbackText({
      ...validInput,
      status: "available",
      reason: undefined,
    });
    expect(fallback).toContain("available");
    expect(fallback).toContain("No booking has been created.");
  });

  it("fallback text never exceeds the 500-character output limit", () => {
    const longReason = "R".repeat(300);
    const longName = "N".repeat(100);

    const unavailable = buildFallbackText({
      ...validInput,
      roomName: longName,
      reason: longReason,
    });
    expect(unavailable.length).toBeLessThanOrEqual(500);
    expect(unavailable).toContain("unavailable");

    const available = buildFallbackText({
      ...validInput,
      status: "available",
      roomName: longName,
      reason: undefined,
    });
    expect(available.length).toBeLessThanOrEqual(500);
    expect(available).toContain("available");
  });

  it("concise fallback preserves the reason code when the combined text would exceed the limit", () => {
    const text = buildFallbackText({
      ...validInput,
      roomName: "N".repeat(100),
      reason: "R".repeat(500),
    });
    expect(text.length).toBeLessThanOrEqual(500);
    expect(text).toContain(validInput.reasonCode);
    expect(countSentences(text)).toBeLessThanOrEqual(MAX_SENTENCES);
  });
});
