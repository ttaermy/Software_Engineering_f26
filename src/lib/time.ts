
/**
 * Shared time parser.
 * Supports 24-hour input and 12-hour input with AM/PM.
 * Returns integer minutes after midnight, or null for invalid input.
 */
export function parseTimeInput(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i.exec(value.trim());

  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3]?.toUpperCase();

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  if (period) {
    if (hours < 1 || hours > 12) return null;

    if (period === "AM") {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
  } else if (hours < 0 || hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
}
