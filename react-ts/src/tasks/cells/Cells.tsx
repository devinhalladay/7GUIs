import { useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import {
  classify,
  COLUMNS,
  createEvaluator,
  formatValue,
  ROWS,
  type Sheet,
} from "./sheet";
import { makeRef } from "./formula";

type Editing = { ref: string; draft: string; source: "grid" | "bar" };

const COLUMN_NAMES = Array.from({ length: COLUMNS }, (_, i) => String.fromCharCode(65 + i));

/** A small starting sheet, so the formula language is visible on arrival. */
const INITIAL: Sheet = {
  A0: "Item",
  B0: "Qty",
  C0: "Price",
  D0: "Total",
  A1: "Widget",
  B1: "4",
  C1: "2.5",
  D1: "=B1*C1",
  A2: "Gadget",
  B2: "3",
  C2: "8",
  D2: "=B2*C2",
  A3: "Doohickey",
  B3: "7",
  C3: "1.25",
  D3: "=B3*C3",
  A5: "Sum",
  D5: "=SUM(D1:D3)",
  A6: "Average",
  D6: "=AVG(D1:D3)",
};

export function Cells() {
  const [sheet, setSheet] = useState<Sheet>(INITIAL);
  const [selected, setSelected] = useState("A1");
  // `source` records which editor is live, so the grid does not steal focus
  // from the formula bar (or vice versa) while a cell is being typed into.
  const [editing, setEditing] = useState<Editing | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // A fresh evaluator per edit: its memo table is the recomputed sheet.
  const evaluator = useMemo(() => createEvaluator(sheet), [sheet]);

  function commit(ref: string, draft: string) {
    setSheet((current) => {
      const next = { ...current };
      if (draft.trim() === "") delete next[ref];
      else next[ref] = draft;
      return next;
    });
  }

  function startEditing(ref: string, draft = sheet[ref] ?? "", source: Editing["source"] = "grid") {
    setSelected(ref);
    setEditing({ ref, draft, source });
  }

  function move(ref: string, columnStep: number, rowStep: number) {
    const column = ref.charCodeAt(0) - 65 + columnStep;
    const row = Number(ref.slice(1)) + rowStep;
    if (column < 0 || column >= COLUMNS || row < 0 || row >= ROWS) return ref;
    return makeRef(column, row);
  }

  function refOf(event: ReactMouseEvent<HTMLElement>): string | null {
    const cell = (event.target as HTMLElement).closest("td[data-ref]");
    return cell instanceof HTMLElement ? (cell.dataset.ref ?? null) : null;
  }

  function handleGridKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (editing) return;
    const steps: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    };
    const step = steps[event.key];
    if (step) {
      event.preventDefault();
      setSelected(move(selected, step[0], step[1]));
    } else if (event.key === "Enter" || event.key === "F2") {
      event.preventDefault();
      startEditing(selected);
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      commit(selected, "");
    } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      // Typing over a cell replaces it, as in a real spreadsheet.
      event.preventDefault();
      startEditing(selected, event.key);
    }
  }

  function handleEditorKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (!editing) return;
    if (event.key === "Enter") {
      commit(editing.ref, editing.draft);
      setSelected(move(editing.ref, 0, 1));
      setEditing(null);
      gridRef.current?.focus();
    } else if (event.key === "Tab") {
      event.preventDefault();
      commit(editing.ref, editing.draft);
      setSelected(move(editing.ref, event.shiftKey ? -1 : 1, 0));
      setEditing(null);
      gridRef.current?.focus();
    } else if (event.key === "Escape") {
      setEditing(null);
      gridRef.current?.focus();
    }
  }

  const selectedValue = evaluator.valueAt(selected);
  const selectedContent = classify(sheet[selected]);

  return (
    <div className="cells">
      <div className="formula-bar">
        <span className="cell-name">{selected}</span>
        <input
          type="text"
          aria-label={`Contents of ${selected}`}
          value={editing?.ref === selected ? editing.draft : (sheet[selected] ?? "")}
          onChange={(e) => startEditing(selected, e.target.value, "bar")}
          onKeyDown={handleEditorKeyDown}
        />
        <span className="cell-preview">
          {selectedContent.kind === "formula" ? `→ ${formatValue(selectedValue)}` : ""}
        </span>
      </div>

      <div
        className="grid"
        ref={gridRef}
        tabIndex={0}
        onKeyDown={handleGridKeyDown}
        onClick={(e) => {
          const ref = refOf(e);
          if (!ref) return;
          if (editing && editing.ref !== ref) {
            commit(editing.ref, editing.draft);
            setEditing(null);
          }
          setSelected(ref);
        }}
        onDoubleClick={(e) => {
          const ref = refOf(e);
          if (ref) startEditing(ref);
        }}
      >
        <table>
          <thead>
            <tr>
              <th className="corner" />
              {COLUMN_NAMES.map((name) => (
                <th key={name}>{name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, row) => (
              <tr key={row}>
                <th className="row-head">{row}</th>
                {COLUMN_NAMES.map((_, column) => {
                  const ref = makeRef(column, row);
                  const value = evaluator.valueAt(ref);
                  const isEditing = editing?.ref === ref && editing.source === "grid";
                  return (
                    <td
                      key={ref}
                      data-ref={ref}
                      className={[
                        ref === selected ? "selected" : "",
                        value.kind === "error" ? "cell-error" : "",
                        value.kind === "number" ? "numeric" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {isEditing ? (
                        <input
                          className="cell-editor"
                          autoFocus
                          value={editing.draft}
                          onChange={(e) => setEditing({ ref, draft: e.target.value, source: "grid" })}
                          onKeyDown={handleEditorKeyDown}
                          onBlur={() => {
                            commit(ref, editing.draft);
                            setEditing(null);
                          }}
                        />
                      ) : (
                        formatValue(value)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="hint">
        Type to overwrite a cell, <kbd>Enter</kbd> or double-click to edit it. Formulas start with{" "}
        <code>=</code> and understand numbers, cell references, ranges, arithmetic and the functions
        SUM, PROD, ADD, SUB, MUL, DIV, MIN, MAX and AVG — e.g. <code>=SUM(D1:D3) / 2</code>.
      </p>
    </div>
  );
}
