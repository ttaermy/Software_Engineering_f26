
import { describe, it, expect } from "vitest";
import {
  checkAvailability,
  intervalsOverlap,
  type RoomState,
} from "./availability";
import { ROOM_FIXTURE } from "./room-fixture";

const room: RoomState = ROOM_FIXTURE;

function check(
  start: number,
  end: number,
  overrides: Partial<RoomState> = {},
  now = 480,
) {
  return checkAvailability({
    start,
    end,
    now,
    room: { ...room, ...overrides },
  });
}

describe("Smart Campus availability — baseline", () => {
  it("T01: allows a slot touching an existing booking's end", () => {
    expect(intervalsOverlap(
      { start: 600, end: 660 },
      { start: 660, end: 720 },
    )).toBe(false);
  });

  it("T02: rejects start equal to end", () => {
    expect(check(700, 700).status).toBe("unavailable");
  });

  it("T03: rejects a start time in the past", () => {
    expect(check(470, 500).status).toBe("unavailable");
  });

  it("T04: allows exactly 120 minutes", () => {
    expect(check(600, 720).status).toBe("available");
  });

  it("T05: rejects a duration longer than 120 minutes", () => {
    expect(check(600, 721).status).toBe("unavailable");
  });

  it("T06: rejects a blocked room", () => {
    expect(check(600, 660, { blocked: true }).status)
      .toBe("unavailable");
  });

  it("T07: rejects a partially overlapping booking", () => {
    expect(check(590, 620).status).toBe("unavailable");
  });

  it("T08: allows a slot touching a booking's start", () => {
    expect(intervalsOverlap(
      { start: 720, end: 780 },
      { start: 660, end: 720 },
    )).toBe(false);
  });

  it("T09: rejects negative start time", () => {
    expect(check(-10, 20).status).toBe("unavailable");
  });

  it("T10: rejects end beyond midnight", () => {
    expect(check(1380, 1441).status).toBe("unavailable");
  });

  it("T11: rejects non-integer minutes", () => {
    expect(check(600.5, 630).status).toBe("unavailable");
  });

  it("T12: does not mutate existing bookings", () => {
    const bookings = [
      { start: 540, end: 600 },
      { start: 780, end: 870 },
    ];
    const original = JSON.stringify(bookings);

    checkAvailability({
      start: 660,
      end: 720,
      now: 480,
      room: { ...room, bookings },
    });

    expect(JSON.stringify(bookings)).toBe(original);
  });

  it("T13: reports unavailable for an identical booking", () => {
    expect(check(540, 600).status).toBe("unavailable");
  });

  it("BUG-A: allows bookings that touch at endpoints", () => {
  expect(
    intervalsOverlap(
      { start: 600, end: 660 },
      { start: 660, end: 720 },
    ),
  ).toBe(false);
});
  it("BUG-B: preserves the original booking list", () => {
  const bookings = [
    { start: 540, end: 600 },
    { start: 780, end: 870 },
  ];
  const original = JSON.stringify(bookings);

  checkAvailability({
    start: 660,
    end: 720,
    now: 480,
    room: { ...room, bookings },
  });

  expect(JSON.stringify(bookings)).toBe(original);
});
});
