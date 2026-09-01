import { useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

type Circle = { id: number; x: number; y: number; diameter: number };

const DEFAULT_DIAMETER = 30;
const WIDTH = 560;
const HEIGHT = 320;

/** The circle under the pointer, nearest one first when they overlap. */
function circleAt(circles: Circle[], x: number, y: number): Circle | null {
  let closest: Circle | null = null;
  let closestDistance = Infinity;
  for (const c of circles) {
    const distance = Math.hypot(c.x - x, c.y - y);
    if (distance <= c.diameter / 2 && distance < closestDistance) {
      closest = c;
      closestDistance = distance;
    }
  }
  return closest;
}

/**
 * Task 6 — Circle Drawer.
 * Undo/redo is a list of whole-canvas snapshots plus a cursor into it, which
 * keeps "one entry per user gesture" easy to honour: dragging the diameter
 * slider previews live but only appends a snapshot when the dialog closes.
 */
export function CircleDrawer() {
  const [history, setHistory] = useState<Circle[][]>([[]]);
  const [index, setIndex] = useState(0);
  const [nextId, setNextId] = useState(1);
  const [hovered, setHovered] = useState<number | null>(null);
  const [menu, setMenu] = useState<{ id: number; x: number; y: number } | null>(null);
  const [adjust, setAdjust] = useState<{ id: number; diameter: number } | null>(null);

  const committed = history[index];
  // While the dialog is open the slider only previews; history is untouched.
  const circles = adjust
    ? committed.map((c) => (c.id === adjust.id ? { ...c, diameter: adjust.diameter } : c))
    : committed;

  function commit(next: Circle[]) {
    setHistory([...history.slice(0, index + 1), next]);
    setIndex(index + 1);
  }

  function positionOf(event: ReactMouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function handleClick(event: ReactMouseEvent<SVGSVGElement>) {
    if (menu || adjust) {
      setMenu(null);
      return;
    }
    const { x, y } = positionOf(event);
    if (circleAt(circles, x, y)) return;
    commit([...circles, { id: nextId, x, y, diameter: DEFAULT_DIAMETER }]);
    setNextId(nextId + 1);
  }

  function handleContextMenu(event: ReactMouseEvent<SVGSVGElement>) {
    event.preventDefault();
    const { x, y } = positionOf(event);
    const target = circleAt(circles, x, y);
    setMenu(target ? { id: target.id, x, y } : null);
  }

  function handleMove(event: ReactMouseEvent<SVGSVGElement>) {
    if (adjust) return;
    const { x, y } = positionOf(event);
    setHovered(circleAt(circles, x, y)?.id ?? null);
  }

  function closeDialog() {
    if (!adjust) return;
    const original = committed.find((c) => c.id === adjust.id);
    if (original && original.diameter !== adjust.diameter) {
      commit(committed.map((c) => (c.id === adjust.id ? { ...c, diameter: adjust.diameter } : c)));
    }
    setAdjust(null);
  }

  const selected = adjust?.id ?? hovered;

  return (
    <div className="stack wide">
      <div className="row">
        <button onClick={() => setIndex(index - 1)} disabled={index === 0 || adjust !== null}>
          Undo
        </button>
        <button
          onClick={() => setIndex(index + 1)}
          disabled={index === history.length - 1 || adjust !== null}
        >
          Redo
        </button>
      </div>

      <div className="canvas-wrapper">
        <svg
          className="canvas"
          width={WIDTH}
          height={HEIGHT}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onMouseMove={handleMove}
          onMouseLeave={() => setHovered(null)}
        >
          {circles.map((c) => (
            <circle
              key={c.id}
              cx={c.x}
              cy={c.y}
              r={c.diameter / 2}
              className={c.id === selected ? "circle selected" : "circle"}
            />
          ))}
        </svg>

        {menu && (
          <div className="context-menu" style={{ left: menu.x, top: menu.y }}>
            <button
              onClick={() => {
                const target = circles.find((c) => c.id === menu.id);
                if (target) setAdjust({ id: target.id, diameter: target.diameter });
                setMenu(null);
              }}
            >
              Adjust diameter…
            </button>
          </div>
        )}

        {adjust && (
          <div className="dialog" role="dialog" aria-label="Adjust diameter">
            <p>Adjust diameter of circle at ({Math.round(circles.find((c) => c.id === adjust.id)?.x ?? 0)}, {Math.round(circles.find((c) => c.id === adjust.id)?.y ?? 0)}).</p>
            <input
              type="range"
              min={4}
              max={200}
              value={adjust.diameter}
              onChange={(e) => setAdjust({ ...adjust, diameter: Number(e.target.value) })}
            />
            <button onClick={closeDialog}>Done</button>
          </div>
        )}
      </div>

      <p className="hint">
        Click empty space to draw. Right-click a circle to adjust its diameter.
      </p>
    </div>
  );
}
