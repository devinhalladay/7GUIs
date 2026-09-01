import { describe, expect, it } from "vitest";
import { formatDate, parseDate } from "./FlightBooker";

describe("parseDate", () => {
  it("accepts a well formed DD.MM.YYYY date", () => {
    expect(parseDate("27.03.2026")?.getFullYear()).toBe(2026);
    expect(parseDate("27.03.2026")?.getMonth()).toBe(2);
    expect(parseDate("27.03.2026")?.getDate()).toBe(27);
  });

  it("rejects malformed input", () => {
    for (const bad of ["", "27.3.2026", "2026-03-27", "tomorrow", "27.03.26"]) {
      expect(parseDate(bad)).toBeNull();
    }
  });

  it("rejects days that do not exist rather than rolling them over", () => {
    expect(parseDate("31.02.2026")).toBeNull();
    expect(parseDate("29.02.2024")).not.toBeNull();
  });
});

describe("formatDate", () => {
  it("round-trips through parseDate", () => {
    const text = "05.01.2027";
    const date = parseDate(text);
    expect(date && formatDate(date)).toBe(text);
  });
});
