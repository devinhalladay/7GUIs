import { useState } from "react";

type TripType = "one-way" | "return";

/**
 * Parses the `DD.MM.YYYY` format the task specifies, returning null when the
 * text is malformed or names a day that does not exist (e.g. 31.02.2026).
 * A plain `new Date(...)` is no good here: it happily rolls February 31st
 * over into March.
 */
export function parseDate(text: string): Date | null {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const [day, month, year] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day);
  const roundTripped =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return roundTripped ? date : null;
}

export function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

/**
 * Task 3 — Flight Booker.
 * The trip type constrains which fields are live, and both the field styling
 * and the button's enabled state are derived from the two dates.
 */
export function FlightBooker() {
  const today = formatDate(new Date());
  const [tripType, setTripType] = useState<TripType>("one-way");
  const [departure, setDeparture] = useState(today);
  const [returning, setReturning] = useState(today);
  const [booked, setBooked] = useState<string | null>(null);

  const departureDate = parseDate(departure);
  const returnDate = parseDate(returning);
  const returnEnabled = tripType === "return";

  const bookable =
    departureDate !== null &&
    (!returnEnabled || (returnDate !== null && returnDate.getTime() >= departureDate.getTime()));

  function book() {
    setBooked(
      returnEnabled
        ? `You have booked a return flight, leaving on ${departure} and returning on ${returning}.`
        : `You have booked a one-way flight on ${departure}.`,
    );
  }

  return (
    <div className="stack">
      <select
        value={tripType}
        onChange={(e) => setTripType(e.target.value as TripType)}
        aria-label="Trip type"
      >
        <option value="one-way">one-way flight</option>
        <option value="return">return flight</option>
      </select>

      <input
        type="text"
        value={departure}
        onChange={(e) => setDeparture(e.target.value)}
        className={departureDate === null ? "invalid" : undefined}
        aria-label="Departure date"
      />

      <input
        type="text"
        value={returning}
        onChange={(e) => setReturning(e.target.value)}
        disabled={!returnEnabled}
        className={returnEnabled && returnDate === null ? "invalid" : undefined}
        aria-label="Return date"
      />

      <button disabled={!bookable} onClick={book}>
        Book
      </button>

      {booked && <p className="notice">{booked}</p>}
    </div>
  );
}
