import { useState } from "react";

const toFahrenheit = (c: number) => c * (9 / 5) + 32;
const toCelsius = (f: number) => (f - 32) * (5 / 9);

/** Parses a field, returning null when it is empty or not a number. */
function parse(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const show = (n: number) => String(Math.round(n * 100) / 100);

/**
 * Task 2 — Temperature Converter.
 * Both fields are editable; typing in one updates the other. An unparseable
 * entry leaves the other field alone rather than clobbering it with NaN.
 */
export function TemperatureConverter() {
  const [celsius, setCelsius] = useState("");
  const [fahrenheit, setFahrenheit] = useState("");

  function changeCelsius(value: string) {
    setCelsius(value);
    const c = parse(value);
    if (c !== null) setFahrenheit(show(toFahrenheit(c)));
  }

  function changeFahrenheit(value: string) {
    setFahrenheit(value);
    const f = parse(value);
    if (f !== null) setCelsius(show(toCelsius(f)));
  }

  return (
    <div className="row">
      <label>
        <input
          type="text"
          value={celsius}
          onChange={(e) => changeCelsius(e.target.value)}
          aria-label="Celsius"
          size={8}
        />{" "}
        Celsius
      </label>
      <span className="equals">=</span>
      <label>
        <input
          type="text"
          value={fahrenheit}
          onChange={(e) => changeFahrenheit(e.target.value)}
          aria-label="Fahrenheit"
          size={8}
        />{" "}
        Fahrenheit
      </label>
    </div>
  );
}
