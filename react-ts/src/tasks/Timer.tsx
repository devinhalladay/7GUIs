import { useEffect, useState } from "react";

const MAX_DURATION = 30;

/**
 * Task 4 — Timer.
 * The gauge fills as time elapses. Dragging the duration slider takes effect
 * at once: shortening it below the elapsed time finishes the timer, and
 * lengthening it starts the timer running again.
 */
export function Timer() {
  const [duration, setDuration] = useState(15);
  const [elapsed, setElapsed] = useState(0);
  const running = elapsed < duration;

  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const delta = (now - last) / 1000;
      last = now;
      setElapsed((e) => Math.min(e + delta, duration));
    }, 100);
    return () => window.clearInterval(id);
  }, [running, duration]);

  return (
    <div className="stack">
      <label className="field">
        <span>Elapsed time</span>
        <progress value={duration === 0 ? 1 : Math.min(elapsed / duration, 1)} />
      </label>

      <p className="elapsed">{elapsed.toFixed(1)}s</p>

      <label className="field">
        <span>Duration</span>
        <input
          type="range"
          min={0}
          max={MAX_DURATION}
          step={0.1}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
        <span className="duration-readout">{duration.toFixed(1)}s</span>
      </label>

      <button onClick={() => setElapsed(0)}>Reset timer</button>
    </div>
  );
}
