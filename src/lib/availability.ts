// Availability logic for the Smart Campus Room Availability Checker.
// Pure functions only — no side effects, no mutation of existing bookings.
// Keeping this isolated makes the acceptance criteria easy to inspect and test.

export interface Booking {
  /** Integer minutes after midnight. Inclusive start, exclusive end. */
  start: number;
  end: number;
}

export interface RoomState {
  /** Stable identifier used by the UI room selector. */
  id: string;
  name: string;
  /** Maximum number of attendees the room can hold. */
  capacity: number;
  /** Equipment items available in the room, e.g. ["Projector", "Whiteboard"]. */
  equipment: string[];
  blocked: boolean;
  bookings: Booking[];
}

export interface CheckRequest {
  /** Integer minutes after midnight. */
  start: number;
  end: number;
  /** Minutes after midnight representing "now". Lets tests freeze time. */
  now: number;
  room: RoomState;
}

export type CheckResult =
  | { status: "available" }
  | { status: "unavailable"; reason: string };

const MINUTES_PER_DAY = 1440;
const MAX_DURATION = 120;

export function isIntegerMinutes(value: number): boolean {
  return Number.isFinite(value) && Number.isInteger(value);
}

/**
 * Two half-open intervals [a.start, a.end) and [b.start, b.end) overlap iff
 * a.start < b.end && b.start < a.end. Touching endpoints do NOT overlap.
 */
export function intervalsOverlap(a: Booking, b: Booking): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Evaluates a single availability check against the six acceptance criteria.
 * Never mutates the room or its bookings.
 */
export function checkAvailability(req: CheckRequest): CheckResult {
  const { start, end, now, room } = req;

  // AC3: reject every request if the selected room is blocked, even when the
  // requested times are invalid. The blocked-room reason takes precedence so a
  // blocked room always reports the same unambiguous outcome.
  if (room.blocked) {
    return {
      status: "unavailable",
      reason: `"${room.name}" is currently blocked and cannot be booked.`,
    };
  }

  // AC1: integer minutes, 0 <= start < end <= 1440, start strictly after now.
  if (!isIntegerMinutes(start) || !isIntegerMinutes(end)) {
    return {
      status: "unavailable",
      reason: "Start and end times must be whole minutes.",
    };
  }
  if (start < 0 || end > MINUTES_PER_DAY) {
    return {
      status: "unavailable",
      reason: "Times must be within the same day (0 to 1440 minutes).",
    };
  }
  if (start >= end) {
    return {
      status: "unavailable",
      reason: "Start time must be earlier than end time.",
    };
  }
  if (start <= now) {
    return {
      status: "unavailable",
      reason: "Start time must be strictly after the current time.",
    };
  }

  // AC2: duration must not exceed 120 minutes (exactly 120 is allowed).
  const duration = end - start;
  if (duration > MAX_DURATION) {
    return {
      status: "unavailable",
      reason: `Duration is ${duration} minutes. Maximum allowed is 120 minutes.`,
    };
  }

  // AC4: reject overlap with any existing booking (endpoint touches are fine).
  const candidate: Booking = { start, end };
  const conflict = room.bookings.find((b) => intervalsOverlap(candidate, b));
  if (conflict) {
    return {
      status: "unavailable",
      reason: `Overlaps an existing booking (${formatTime(conflict.start)} – ${formatTime(conflict.end)}).`,
    };
  }

  // AC5: unambiguous available result.
  return { status: "available" };
}

/** Formats integer minutes after midnight as a 12-hour clock string. */
export function formatTime(minutes: number): string {
  const m = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h24 = Math.floor(m / 60);
  const min = m % 60;
  const period = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const mm = min.toString().padStart(2, "0");
  return `${h12}:${mm} ${period}`;
}
