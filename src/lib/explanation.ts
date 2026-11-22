// Mock-based "Explain availability" module (Practice Work #11, stage 1).
// No real API calls, keys, backend, or authentication. The adapter is fully
// deterministic and validated; the availability result from checkAvailability()
// always remains the authoritative decision.

import { parseTimeInput } from "@/lib/time";

export interface ExplanationInput {
  roomName: string;
  startTime: string;
  endTime: string;
  status: "available" | "unavailable";
  reasonCode: string;
  reason?: string;
}

export interface ExplanationOutput {
  /** "mock" = adapter output; "fallback" = deterministic built-in text. */
  source: "mock" | "fallback";
  text: string;
}

export type ExplanationAdapter = (input: ExplanationInput) => string;

export const MAX_SENTENCES = 2;
const MAX_ROOM_NAME = 100;
const MAX_TIME = 20;
const MAX_REASON_CODE = 50;
const MAX_REASON = 300;
const MAX_TEXT = 500;

const REASON_CODE_RE = /^[a-zA-Z0-9_-]+$/;

// Mirrors the formats accepted by parseTimeInput in App.tsx: optional 12-hour
// AM/PM suffix. With AM/PM the hour must be 1-12; without it, 0-23.

function isValidTimeFormat(value: string): boolean {
  return parseTimeInput(value) !== null;
}

/**
 * Validates and normalizes structured explanation input. Returns null when the
 * input is empty, malformed, or excessively long.
 */
export function validateExplanationInput(
  input: unknown,
): ExplanationInput | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;

  const roomName = typeof raw.roomName === "string" ? raw.roomName.trim() : "";
  const startTime = typeof raw.startTime === "string" ? raw.startTime.trim() : "";
  const endTime = typeof raw.endTime === "string" ? raw.endTime.trim() : "";
  const reasonCode =
    typeof raw.reasonCode === "string" ? raw.reasonCode.trim() : "";
  const reason = typeof raw.reason === "string" ? raw.reason.trim() : "";
  const status = raw.status;

  if (
    roomName.length === 0 ||
    roomName.length > MAX_ROOM_NAME ||
    startTime.length === 0 ||
    startTime.length > MAX_TIME ||
    endTime.length === 0 ||
    endTime.length > MAX_TIME ||
    !isValidTimeFormat(startTime) ||
    !isValidTimeFormat(endTime) ||
    reasonCode.length === 0 ||
    reasonCode.length > MAX_REASON_CODE ||
    !REASON_CODE_RE.test(reasonCode) ||
    reason.length > MAX_REASON ||
    (status !== "available" && status !== "unavailable")
  ) {
    return null;
  }

  const normalized: ExplanationInput = {
    roomName,
    startTime,
    endTime,
    status,
    reasonCode,
  };
  if (reason.length > 0) normalized.reason = reason;
  return normalized;
}

/** Strips sentence terminators so embedded reasons cannot add sentences. */
function sanitizeFragment(value: string): string {
  return value.replace(/[.!?]+/g, ",").replace(/,+$/, "").trim();
}

/**
 * Simple heuristic sentence counter: splits on `.`, `!`, or `?` and counts
 * non-empty fragments. It does not understand abbreviations ("e.g.", "Dr.",
 * "3 p.m.") or decimals ("1.5"), so it can overcount; it is intentionally
 * kept as a conservative gate, not a grammar-aware parser.
 */
export function countSentences(text: string): number {
  return text
    .split(/[.!?]+/)
    .filter((sentence) => sentence.trim().length > 0).length;
}

/**
 * Validates adapter output: must be a non-empty string within the length
 * limit and at most two sentences. Returns the trimmed text or null.
 */
export function validateExplanationText(text: unknown): string | null {
  if (typeof text !== "string") return null;
  const trimmed = text.trim();
  if (
    trimmed.length === 0 ||
    trimmed.length > MAX_TEXT ||
    countSentences(trimmed) > MAX_SENTENCES
  ) {
    return null;
  }
  return trimmed;
}

/**
 * Deterministic mock adapter. Stands in for a future real explanation
 * service; always produces at most two sentences.
 */
export function mockExplainAdapter(input: ExplanationInput): string {
  if (input.status === "available") {
    return (
      `${input.roomName} is open between ${input.startTime} and ${input.endTime}. ` +
      `No conflicting bookings or restrictions were reported for this slot.`
    );
  }
  const detail = input.reason
    ? sanitizeFragment(input.reason)
    : `Reason code ${input.reasonCode}`;
  return (
    `${input.roomName} is not available between ${input.startTime} and ${input.endTime}. ` +
    `${detail}, so the checker rejected this slot.`
  );
}

/** Deterministic fallback used when the adapter fails or returns invalid output. */
export function buildFallbackText(input: ExplanationInput): string {
  if (input.status === "available") {
    const text =
      `The checker confirmed this slot is available in ${input.roomName}. ` +
      `No booking has been created.`;
    if (text.length <= MAX_TEXT) return text;
    return `This slot is available. No booking has been created.`;
  }
  const detail = input.reason
    ? sanitizeFragment(input.reason)
    : `Reason code ${input.reasonCode}`;
  const text =
    `The checker determined this slot is unavailable in ${input.roomName}. ` +
    `${detail}.`;
  if (text.length <= MAX_TEXT) return text;
  // Concise fallback that always fits: preserves the authoritative status and
  // the reason code even if a very long reason was supplied.
  return `This slot is unavailable. Reason code ${input.reasonCode}.`;
}

/**
 * Runs the adapter against validated input and validates its output. On any
 * adapter failure (throw, malformed output, too many sentences) it returns
 * the deterministic fallback derived from the original availability result.
 */
export function explainAvailability(
  input: unknown,
  adapter: ExplanationAdapter = mockExplainAdapter,
): ExplanationOutput {
  const validated = validateExplanationInput(input);
  if (!validated) {
    return { source: "fallback", text: "Explanation is unavailable for this request." };
  }
  try {
    const text = validateExplanationText(adapter(validated));
    if (text) return { source: "mock", text };
  } catch {
    // Adapter failure falls through to the deterministic fallback.
  }
  return { source: "fallback", text: buildFallbackText(validated) };
}
