import { useState } from "react";

/**
 * Task 1 — Counter.
 * A read-only field showing a count, and a button that increments it.
 */
export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="row">
      <input type="text" readOnly value={count} aria-label="Count" size={6} />
      <button onClick={() => setCount((c) => c + 1)}>Count</button>
    </div>
  );
}
