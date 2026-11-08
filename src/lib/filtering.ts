import type { RoomState } from "@/lib/availability";

/**
 * Returns rooms whose capacity is at least the requested number of attendees.
 * A non-positive attendee count matches every room (no capacity constraint).
 * Pure: never mutates the input array or its rooms.
 */
export function filterByCapacity(
  rooms: RoomState[],
  attendees: number,
): RoomState[] {
  if (!Number.isFinite(attendees) || attendees <= 0) return rooms;
  return rooms.filter((room) => room.capacity >= attendees);
}

/**
 * Returns rooms that contain every selected equipment item. Matching is
 * case-insensitive. An empty selection matches every room.
 * Pure: never mutates the input array or its rooms.
 */
export function filterByEquipment(
  rooms: RoomState[],
  requiredEquipment: string[],
): RoomState[] {
  if (requiredEquipment.length === 0) return rooms;
  const required = requiredEquipment.map((item) => item.trim().toLowerCase());
  return rooms.filter((room) => {
    const available = room.equipment.map((item) => item.toLowerCase());
    return required.every((item) => available.includes(item));
  });
}

export interface RoomFilters {
  attendees: number;
  equipment: string[];
}

/**
 * Applies capacity and equipment filtering in sequence. Blocked rooms that
 * match the filters are retained so the UI can show their blocked status, but
 * checkAvailability() still never reports them as available.
 */
export function filterRooms(
  rooms: RoomState[],
  filters: RoomFilters,
): RoomState[] {
  return filterByEquipment(
    filterByCapacity(rooms, filters.attendees),
    filters.equipment,
  );
}
