import type { RoomState } from "@/lib/availability";

export type RoomCatalog = RoomState[];

// Catalog of fictional rooms for the Smart Campus Room Availability Checker.
// The original room (lib-204) is preserved exactly, including its three booking
// intervals. Each room has a unique id, capacity, equipment list, blocked
// status, and its own bookings.
export const ROOMS: RoomCatalog = [
  {
    id: "lib-204",
    name: "Library Study Room 204",
    capacity: 6,
    equipment: ["Whiteboard", "Power Outlets"],
    blocked: false,
    bookings: [
      { start: 540, end: 600 },
      { start: 780, end: 870 },
      { start: 1020, end: 1080 },
    ],
  },
  {
    id: "eng-110",
    name: "Engineering Lab 110",
    capacity: 24,
    equipment: ["Projector", "Whiteboard", "Power Outlets"],
    blocked: false,
    bookings: [
      { start: 600, end: 720 },
      { start: 900, end: 960 },
    ],
  },
  {
    id: "aud-301",
    name: "Auditorium 301",
    capacity: 80,
    equipment: ["Projector", "Microphone", "Stage Lighting"],
    blocked: true,
    bookings: [
      { start: 540, end: 660 },
    ],
  },
  {
    id: "collab-a",
    name: "Collaboration Space A",
    capacity: 12,
    equipment: ["TV Screen", "Whiteboard"],
    blocked: false,
    bookings: [
      { start: 720, end: 780 },
      { start: 840, end: 900 },
      { start: 1080, end: 1140 },
    ],
  },
];

// Convenience reference to the original room for existing regression tests.
// Resolved by id so the reference stays correct even if the catalog is reordered.
export const ROOM_FIXTURE: RoomState = ROOMS.find(
  (room) => room.id === "lib-204",
) as RoomState;

/** Returns a deep-enough copy of a room so the caller can toggle UI state
 * without mutating the shared fixture's bookings array. */
export function cloneRoom(room: RoomState): RoomState {
  return {
    ...room,
    bookings: room.bookings.map((booking) => ({ ...booking })),
  };
}
