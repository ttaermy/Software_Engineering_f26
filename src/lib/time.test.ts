import { describe, expect, it } from "vitest";
import { parseTimeInput } from "./time";

describe("parseTimeInput", () => {
  it.each([
    ["09:30", 570],
    ["23:59", 1439],
    ["12:00 AM", 0],
    ["12:00 PM", 720],
    ["1:30 PM", 810],
    ["09:30 am", 570],
  ])("parses %s", (input, expected) => {
    expect(parseTimeInput(input)).toBe(expected);
  });

  it.each([
    "",
    "25:00",
    "12:60",
    "13:00 PM",
    "00:30 AM",
    "abc",
    "9:30 XM",
  ])("rejects %s", (input) => {
    expect(parseTimeInput(input)).toBeNull();
  });
});
