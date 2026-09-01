import { evaluate, FormulaError, parseFormula, type Expr } from "./formula";

export const COLUMNS = 26;
export const ROWS = 100;

/** Raw, as-typed cell contents keyed by reference (`"A1"`). */
export type Sheet = Record<string, string>;

export type CellValue =
  | { kind: "empty" }
  | { kind: "number"; value: number }
  | { kind: "text"; text: string }
  | { kind: "error"; message: string };

type Content =
  | { kind: "empty" }
  | { kind: "number"; value: number }
  | { kind: "text"; text: string }
  | { kind: "formula"; source: string };

const CIRCULAR = "circular reference";

export function classify(raw: string | undefined): Content {
  const text = (raw ?? "").trim();
  if (text === "") return { kind: "empty" };
  if (text.startsWith("=")) return { kind: "formula", source: text.slice(1) };
  const value = Number(text);
  if (text !== "" && Number.isFinite(value)) return { kind: "number", value };
  return { kind: "text", text };
}

export function formatValue(value: CellValue): string {
  switch (value.kind) {
    case "empty":
      return "";
    case "number":
      return String(Math.round(value.value * 1e10) / 1e10);
    case "text":
      return value.text;
    case "error":
      return `#${value.message}`;
  }
}

/**
 * Computes cell values on demand, memoizing as it goes. Recursion through
 * `numberAt` is what makes an edit propagate: anything that (transitively)
 * reads a changed cell is recomputed the next time it is asked for, and a
 * reference that comes back around to a cell already being computed is
 * reported as a circular reference instead of blowing the stack.
 */
export function createEvaluator(sheet: Sheet) {
  const cache = new Map<string, CellValue>();
  const parsed = new Map<string, Expr | FormulaError>();
  const visiting = new Set<string>();

  function parse(source: string): Expr {
    let result = parsed.get(source);
    if (result === undefined) {
      try {
        result = parseFormula(source);
      } catch (error) {
        result = error instanceof FormulaError ? error : new FormulaError("bad formula");
      }
      parsed.set(source, result);
    }
    if (result instanceof FormulaError) throw result;
    return result;
  }

  function valueAt(ref: string): CellValue {
    const cached = cache.get(ref);
    if (cached) return cached;

    if (visiting.has(ref)) throw new FormulaError(CIRCULAR);

    const content = classify(sheet[ref]);
    let value: CellValue;
    if (content.kind === "formula") {
      visiting.add(ref);
      try {
        value = { kind: "number", value: evaluate(parse(content.source), numberAt) };
      } catch (error) {
        value = { kind: "error", message: error instanceof Error ? error.message : "error" };
      } finally {
        visiting.delete(ref);
      }
    } else {
      value = content;
    }

    cache.set(ref, value);
    return value;
  }

  function numberAt(ref: string): number {
    const value = valueAt(ref);
    switch (value.kind) {
      case "number":
        return value.value;
      case "empty":
        return 0;
      case "text":
        throw new FormulaError(`${ref} is not a number`);
      case "error":
        // A cycle is a property of the sheet rather than of one cell, so it
        // travels unchanged instead of collecting a trail of cell names.
        throw new FormulaError(
          value.message === CIRCULAR ? CIRCULAR : `${ref}: ${value.message}`,
        );
    }
  }

  return { valueAt };
}
