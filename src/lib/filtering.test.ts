import { describe, it, expect } from "vitest";
import { checkAvailability } from "./availability";
import { ROOMS, ROOM_FIXTURE } from "./room-fixture";
import {
  filterByCapacity,
  filterByEquipment,
  filterRooms,
} from "./filtering";

describe("Room catalog (F1)", () => {
  it("contains at least four rooms", () => {
    expect(ROOMS.length).toBeGreaterThanOrEqual(4);
  });

  it("each room has unique id, capacity, equipment, blocked, and bookings", () => {
    const ids = ROOMS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const room of ROOMS) {
      expect(typeof room.id).toBe("string");
      expect(room.id.length).toBeGreaterThan(0);
      expect(typeof room.name).toBe("string");
      expect(room.name.length).toBeGreaterThan(0);
      expect(typeof room.capacity).toBe("number");
      expect(room.capacity).toBeGreaterThan(0);
      expect(Array.isArray(room.equipment)).toBe(true);
      expect(room.equipment.length).toBeGreaterThan(0);
      expect(typeof room.blocked).toBe("boolean");
      expect(Array.isArray(room.bookings)).toBe(true);
    }
  });

  it("preserves the original Library Study Room 204 and its three bookings", () => {
    expect(ROOM_FIXTURE.id).toBe("lib-204");
    expect(ROOM_FIXTURE.name).toBe("Library Study Room 204");
    expect(ROOM_FIXTURE.blocked).toBe(false);
    expect(ROOM_FIXTURE.bookings).toEqual([
      { start: 540, end: 600 },
      { start: 780, end: 870 },
      { start: 1020, end: 1080 },
    ]);
  });
});

describe("Capacity filtering (F2)", () => {
  it("returns only rooms with capacity >= attendees", () => {
    const result = filterByCapacity(ROOMS, 24);
    for (const room of result) {
      expect(room.capacity).toBeGreaterThanOrEqual(24);
    }
    expect(result.some((r) => r.id === "eng-110")).toBe(true);
    expect(result.some((r) => r.id === "aud-301")).toBe(true);
  });

  it("returns an empty array when no room qualifies", () => {
    expect(filterByCapacity(ROOMS, 100)).toEqual([]);
  });

  it("returns all rooms when attendees is non-positive", () => {
    expect(filterByCapacity(ROOMS, 0)).toHaveLength(ROOMS.length);
    expect(filterByCapacity(ROOMS, -1)).toHaveLength(ROOMS.length);
  });

  it("does not mutate the input", () => {
    const snapshot = JSON.stringify(ROOMS);
    filterByCapacity(ROOMS, 10);
    expect(JSON.stringify(ROOMS)).toBe(snapshot);
  });
});

describe("Equipment filtering (F3)", () => {
  it("returns only rooms containing all selected equipment (case-insensitive)", () => {
    const result = filterByEquipment(ROOMS, ["projector"]);
    expect(result.every((r) => r.equipment.some((e) => e.toLowerCase() === "projector"))).toBe(true);

    const withBoth = filterByEquipment(ROOMS, ["Projector", "Whiteboard"]);
    for (const room of withBoth) {
      const lower = room.equipment.map((e) => e.toLowerCase());
      expect(lower).toContain("projector");
      expect(lower).toContain("whiteboard");
    }
  });

  it("excludes a room missing one of the selected items", () => {
    const result = filterByEquipment(ROOMS, ["Projector", "Microphone"]);
    expect(result.some((r) => r.id === "aud-301")).toBe(true);
    expect(result.some((r) => r.id === "eng-110")).toBe(false);
  });

  it("returns all rooms when no equipment is selected", () => {
    expect(filterByEquipment(ROOMS, [])).toHaveLength(ROOMS.length);
  });

  it("ignores case and surrounding whitespace in required items", () => {
    const result = filterByEquipment(ROOMS, ["  PROJECTOR  "]);
    expect(result.every((r) => r.equipment.some((e) => e.toLowerCase() === "projector"))).toBe(true);
  });
});

describe("Combined filtering", () => {
  it("applies capacity and equipment filters together", () => {
    const result = filterRooms(ROOMS, { attendees: 10, equipment: ["Projector"] });
    for (const room of result) {
      expect(room.capacity).toBeGreaterThanOrEqual(10);
      expect(room.equipment.map((e) => e.toLowerCase())).toContain("projector");
    }
  });

  it("returns an empty list when no room matches both filters", () => {
    expect(filterRooms(ROOMS, { attendees: 100, equipment: ["Projector"] })).toEqual([]);
  });
});

describe("Blocked rooms are never available (F4)", () => {
  it("a blocked room passing filters is still unavailable via checkAvailability", () => {
    const blocked = filterRooms(ROOMS, { attendees: 1, equipment: [] }).find(
      (r) => r.blocked,
    );
    expect(blocked).toBeDefined();
    const result = checkAvailability({
      start: 660,
      end: 720,
      now: 480,
      room: blocked!,
    });
    expect(result.status).toBe("unavailable");
    if (result.status === "unavailable") {
      expect(result.reason).toContain("blocked");
    }
  });

  it("blocked rooms remain in filtered results so the UI can show their status", () => {
    const result = filterRooms(ROOMS, { attendees: 1, equipment: [] });
    expect(result.some((r) => r.blocked)).toBe(true);
  });
});

describe("Integration: filter -> checkAvailability pipeline (pure, no UI)", () => {
  const now = 480;

  // This test exercises the pure filtering + validation pipeline directly.
  // It does NOT render React or simulate user selection events. It verifies
  // that, given the same filtered catalog the UI uses, different rooms yield
  // different availability outcomes for the same time slot.
  it("different rooms in the filtered catalog yield different availability for the same slot", () => {
    const candidates = filterRooms(ROOMS, { attendees: 1, equipment: [] });
    expect(candidates.length).toBeGreaterThanOrEqual(2);

    // Pick an open room and a slot that is available for it.
    const openRoom = candidates.find((r) => !r.blocked && r.id === "lib-204")!;
    const availableResult = checkAvailability({
      start: 660,
      end: 720,
      now,
      room: openRoom,
    });
    expect(availableResult.status).toBe("available");

    // Select a different room whose booking overlaps 660..720 -> unavailable.
    const overlapRoom = candidates.find((r) => r.id === "eng-110")!;
    const overlapResult = checkAvailability({
      start: 660,
      end: 720,
      now,
      room: overlapRoom,
    });
    expect(overlapResult.status).toBe("unavailable");
  });

  it("when filters exclude all rooms, the filtered list is empty", () => {
    const empty = filterRooms(ROOMS, { attendees: 1000, equipment: [] });
    expect(empty).toEqual([]);
  });
});
