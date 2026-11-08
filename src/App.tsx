import { useEffect, useMemo, useState } from "react";

import {
  Building2,
  CheckCircle2,
  Clock,
  DoorClosed,
  Info,
  Lock,
  Monitor,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import {
  checkAvailability,
  formatTime,
  type CheckResult,
  type RoomState,
} from "@/lib/availability";
import { ROOMS, cloneRoom } from "@/lib/room-fixture";
import { filterRooms } from "@/lib/filtering";

/** Current time in integer minutes after midnight, recomputed per render. */
function currentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function parseTimeInput(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(value.trim());
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  if (period) {
    if (hours < 1 || hours > 12) return null;
    if (period === "AM") hours = hours === 12 ? 0 : hours;
    else hours = hours === 12 ? 12 : hours + 12;
  }
  return hours * 60 + minutes;
}

/** Union of every equipment item across the catalog, used for the filter UI. */
const ALL_EQUIPMENT: string[] = Array.from(
  new Set(ROOMS.flatMap((r) => r.equipment)),
).sort();

export default function App() {
  const [attendees, setAttendees] = useState<number>(1);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(ROOMS[0].id);
  const [startText, setStartText] = useState("");
  const [endText, setEndText] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const now = currentMinutes();

  const matchingRooms = useMemo(
    () => filterRooms(ROOMS, { attendees, equipment: selectedEquipment }),
    [attendees, selectedEquipment],
  );

  // Keep the selected room within the filtered set: if the current selection is
  // excluded by the filters, auto-select the first match (or clear and render
  // the empty state when nothing matches).
  const selectedRoom: RoomState | null = useMemo(() => {
    const found = matchingRooms.find((r) => r.id === selectedRoomId) ?? null;
    if (found) return cloneRoom(found);
    return matchingRooms[0] ? cloneRoom(matchingRooms[0]) : null;
  }, [matchingRooms, selectedRoomId]);

  // When the effective selected room changes (because the user picked a new
  // room or because filters forced a switch), recompute the availability result
  // for the newly selected room using the current time inputs.
  useEffect(() => {
    if (!selectedRoom) {
      setResult(null);
      setError(null);
      return;
    }

    if (!startText && !endText) {
      setResult(null);
      return;
    }

    const start = parseTimeInput(startText);
    const end = parseTimeInput(endText);
    if (start === null || end === null) {
      return;
    }
    setResult(checkAvailability({ start, end, now, room: selectedRoom }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom?.id]);

  function handleCheck() {
    setError(null);
    setResult(null);

    if (!selectedRoom) {
      setError("No rooms match the current filters.");
      return;
    }

    const start = parseTimeInput(startText);
    const end = parseTimeInput(endText);

    if (start === null) {
      setError("Enter a valid start time, e.g. 10:30 AM.");
      return;
    }
    if (end === null) {
      setError("Enter a valid end time, e.g. 11:30 AM.");
      return;
    }

    setResult(checkAvailability({ start, end, now, room: selectedRoom }));
  }

  function handleReset() {
    setStartText("");
    setEndText("");
    setResult(null);
    setError(null);
  }

  function toggleEquipment(item: string) {
    setSelectedEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item],
    );
    setResult(null);
    setError(null);
  }

  function clearFilters() {
    setAttendees(1);
    setSelectedEquipment([]);
    setResult(null);
    setError(null);
  }

  const hasActiveFilters = attendees > 1 || selectedEquipment.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <FilterBar
          attendees={attendees}
          onAttendeesChange={setAttendees}
          equipment={ALL_EQUIPMENT}
          selectedEquipment={selectedEquipment}
          onToggleEquipment={toggleEquipment}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
          matchCount={matchingRooms.length}
        />

        {matchingRooms.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <RoomSelector
              rooms={matchingRooms}
              selectedId={selectedRoom?.id ?? null}
              onSelect={setSelectedRoomId}
            />

            {selectedRoom && (
              <RoomCard room={selectedRoom} now={now} />
            )}

            <section
              aria-label="Check availability"
              className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                Check a time slot
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Times are on a 24-hour day. A slot may be up to 120 minutes long
                and must start after the current time.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <TimeField
                  label="Start time"
                  placeholder="e.g. 10:30 AM"
                  value={startText}
                  onChange={setStartText}
                />
                <TimeField
                  label="End time"
                  placeholder="e.g. 11:30 AM"
                  value={endText}
                  onChange={setEndText}
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"
                >
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleCheck}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Check availability
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  Clear
                </button>
              </div>

              {result && <ResultPanel result={result} />}
            </section>
          </>
        )}

        <Legend />
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-5 sm:px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-900 sm:text-lg">
            Smart Campus Room Availability Checker
          </h1>
          <p className="text-xs text-slate-500 sm:text-sm">
            Prototype · availability only · no bookings are created
          </p>
        </div>
      </div>
    </header>
  );
}

function FilterBar({
  attendees,
  onAttendeesChange,
  equipment,
  selectedEquipment,
  onToggleEquipment,
  onClear,
  hasActiveFilters,
  matchCount,
}: {
  attendees: number;
  onAttendeesChange: (value: number) => void;
  equipment: string[];
  selectedEquipment: string[];
  onToggleEquipment: (item: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
  matchCount: number;
}) {
  return (
    <section
      aria-label="Room filters"
      className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Search className="h-4 w-4 text-slate-500" />
          Filter rooms
        </h2>
        <span className="text-xs font-medium text-slate-500">
          {matchCount} {matchCount === 1 ? "room" : "rooms"} match
        </span>
      </div>

      <div className="mt-4 grid gap-5">
        <label className="block">
          <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Users className="h-4 w-4 text-slate-500" />
            Minimum attendees
          </span>
          <input
            type="number"
            min={1}
            value={attendees}
            onChange={(e) => {
              const value = Number(e.target.value);
              onAttendeesChange(Number.isFinite(value) ? value : 1);
            }}
            className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </label>

        <fieldset>
          <legend className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Monitor className="h-4 w-4 text-slate-500" />
            Required equipment
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {equipment.map((item) => {
              const active = selectedEquipment.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onToggleEquipment(item)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                    active
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      {hasActiveFilters && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}

function RoomSelector({
  rooms,
  selectedId,
  onSelect,
}: {
  rooms: RoomState[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section
      aria-label="Room selection"
      className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 className="text-base font-semibold text-slate-900">Select a room</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {rooms.map((room) => {
          const active = room.id === selectedId;
          return (
            <button
              key={room.id}
              type="button"
              onClick={() => onSelect(room.id)}
              className={`flex items-start justify-between gap-2 rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                active
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {room.name}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Capacity {room.capacity} · {room.equipment.join(", ")}
                </p>
              </div>
              {room.blocked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                  <Lock className="h-3 w-3" />
                  Blocked
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function RoomCard({ room, now }: { room: RoomState; now: number }) {
  return (
    <section
      aria-label="Selected room"
      className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            room.blocked ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {room.blocked ? <Lock className="h-5 w-5" /> : <DoorClosed className="h-5 w-5" />}
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{room.name}</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Capacity: <span className="font-medium text-slate-700">{room.capacity}</span>
            {" · "}
            Current time:{" "}
            <span className="font-medium text-slate-700">{formatTime(now)}</span>
          </p>
          <p
            className={`mt-0.5 inline-flex items-center gap-1.5 text-sm font-medium ${
              room.blocked ? "text-rose-700" : "text-emerald-700"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                room.blocked ? "bg-rose-500" : "bg-emerald-500"
              }`}
            />
            {room.blocked ? "Blocked" : "Open"}
          </p>
          {room.equipment.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {room.equipment.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                >
                  <Monitor className="h-3 w-3" />
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          Existing bookings today
        </h3>
        {room.bookings.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No existing bookings.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {room.bookings.map((b, i) => (
              <li
                key={i}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
              >
                {formatTime(b.start)} – {formatTime(b.end)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <section
      aria-label="No matching rooms"
      className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Search className="h-6 w-6 text-slate-400" />
      </div>
      <h2 className="mt-4 text-base font-semibold text-slate-900">
        No rooms match your filters
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Try lowering the minimum attendees or removing required equipment to see
        more rooms.
      </p>
    </section>
  );
}

function TimeField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="text"
        inputMode="text"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      />
    </label>
  );
}

function ResultPanel({ result }: { result: CheckResult }) {
  const available = result.status === "available";
  return (
    <div
      role="status"
      className={`mt-6 rounded-xl border p-4 sm:p-5 ${
        available
          ? "border-emerald-200 bg-emerald-50"
          : "border-rose-200 bg-rose-50"
      }`}
    >
      <div className="flex items-start gap-3">
        {available ? (
          <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
        ) : (
          <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-rose-600" />
        )}
        <div>
          <p
            className={`text-base font-semibold ${
              available ? "text-emerald-800" : "text-rose-800"
            }`}
          >
            {available ? "Available" : "Unavailable"}
          </p>
          <p
            className={`mt-0.5 text-sm ${
              available ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {available
              ? "This time slot is open. No booking has been created."
              : result.reason}
          </p>
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <p className="mt-6 text-center text-xs text-slate-400">
      Fictional data for prototype use. The checker reports availability only —
      it never creates or confirms a booking.
    </p>
  );
}
