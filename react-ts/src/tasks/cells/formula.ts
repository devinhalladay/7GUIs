/**
 * A tiny formula language for the Cells task, following the grammar in the
 * 7GUIs spec (numbers, cell references, ranges and function application) and
 * adding infix arithmetic with parentheses, which is what people reach for
 * first when they try a spreadsheet out.
 */

export type Expr =
  | { kind: "number"; value: number }
  | { kind: "cell"; ref: string }
  | { kind: "range"; from: string; to: string }
  | { kind: "call"; name: string; args: Expr[] }
  | { kind: "binary"; op: "+" | "-" | "*" | "/"; left: Expr; right: Expr }
  | { kind: "negate"; operand: Expr };

export class FormulaError extends Error {}

type Punct = "(" | ")" | "," | ":" | "+" | "-" | "*" | "/";

type Token =
  | { type: "number"; value: number }
  | { type: "ident"; value: string }
  | { type: "punct"; value: Punct };

const PUNCT = new Set<string>(["(", ")", ",", ":", "+", "-", "*", "/"]);

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const char = input[i];
    if (/\s/.test(char)) {
      i++;
    } else if (/[0-9]/.test(char) || (char === "." && /[0-9]/.test(input[i + 1] ?? ""))) {
      const start = i;
      while (i < input.length && /[0-9.]/.test(input[i])) i++;
      const value = Number(input.slice(start, i));
      if (!Number.isFinite(value)) throw new FormulaError(`bad number "${input.slice(start, i)}"`);
      tokens.push({ type: "number", value });
    } else if (/[A-Za-z_]/.test(char)) {
      const start = i;
      while (i < input.length && /[A-Za-z0-9_]/.test(input[i])) i++;
      tokens.push({ type: "ident", value: input.slice(start, i) });
    } else if (PUNCT.has(char)) {
      tokens.push({ type: "punct", value: char as Punct });
      i++;
    } else {
      throw new FormulaError(`unexpected character "${char}"`);
    }
  }
  return tokens;
}

const CELL_PATTERN = /^([A-Za-z])([0-9]{1,2})$/;

/** Normalizes `a1` to `A1`, or returns null when the identifier is not a reference. */
export function normalizeRef(ident: string): string | null {
  const match = CELL_PATTERN.exec(ident);
  if (!match) return null;
  return match[1].toUpperCase() + String(Number(match[2]));
}

/** Parses the body of a formula (everything after the leading `=`). */
export function parseFormula(source: string): Expr {
  const tokens = tokenize(source);
  let pos = 0;

  const peek = () => tokens[pos];
  const eat = (value: string) => {
    const token = peek();
    if (token?.type === "punct" && token.value === value) {
      pos++;
      return true;
    }
    return false;
  };
  const expect = (value: string) => {
    if (!eat(value)) throw new FormulaError(`expected "${value}"`);
  };

  function parseExpr(): Expr {
    let left = parseTerm();
    for (;;) {
      const token = peek();
      if (token?.type !== "punct" || (token.value !== "+" && token.value !== "-")) return left;
      pos++;
      left = { kind: "binary", op: token.value, left, right: parseTerm() };
    }
  }

  function parseTerm(): Expr {
    let left = parseFactor();
    for (;;) {
      const token = peek();
      if (token?.type !== "punct" || (token.value !== "*" && token.value !== "/")) return left;
      pos++;
      left = { kind: "binary", op: token.value, left, right: parseFactor() };
    }
  }

  function parseFactor(): Expr {
    const token = peek();
    if (!token) throw new FormulaError("unexpected end of formula");

    if (token.type === "punct" && token.value === "-") {
      pos++;
      return { kind: "negate", operand: parseFactor() };
    }
    if (token.type === "punct" && token.value === "(") {
      pos++;
      const inner = parseExpr();
      expect(")");
      return inner;
    }
    if (token.type === "number") {
      pos++;
      return { kind: "number", value: token.value };
    }
    if (token.type === "ident") {
      pos++;
      if (eat("(")) {
        const args: Expr[] = [];
        if (!eat(")")) {
          do {
            args.push(parseArgument());
          } while (eat(","));
          expect(")");
        }
        return { kind: "call", name: token.value.toUpperCase(), args };
      }
      const ref = normalizeRef(token.value);
      if (!ref) throw new FormulaError(`unknown name "${token.value}"`);
      return { kind: "cell", ref };
    }
    throw new FormulaError("unexpected token");
  }

  /** Ranges are only meaningful as arguments, so they are parsed only here. */
  function parseArgument(): Expr {
    const token = peek();
    const next = tokens[pos + 1];
    if (
      token?.type === "ident" &&
      next?.type === "punct" &&
      next.value === ":" &&
      normalizeRef(token.value)
    ) {
      const to = tokens[pos + 2];
      if (to?.type !== "ident") throw new FormulaError("expected a cell after \":\"");
      const from = normalizeRef(token.value);
      const until = normalizeRef(to.value);
      if (!from || !until) throw new FormulaError("bad range");
      pos += 3;
      return { kind: "range", from, to: until };
    }
    return parseExpr();
  }

  const expr = parseExpr();
  if (pos !== tokens.length) {
    const rest = peek();
    if (rest?.type === "punct" && rest.value === ":") {
      throw new FormulaError("a range is only allowed as a function argument");
    }
    throw new FormulaError("trailing input");
  }
  return expr;
}

export function splitRef(ref: string): { column: number; row: number } {
  return { column: ref.charCodeAt(0) - 65, row: Number(ref.slice(1)) };
}

export function makeRef(column: number, row: number): string {
  return String.fromCharCode(65 + column) + row;
}

/** Every cell a range covers, walking the rectangle between its corners. */
export function expandRange(from: string, to: string): string[] {
  const a = splitRef(from);
  const b = splitRef(to);
  const refs: string[] = [];
  for (let column = Math.min(a.column, b.column); column <= Math.max(a.column, b.column); column++) {
    for (let row = Math.min(a.row, b.row); row <= Math.max(a.row, b.row); row++) {
      refs.push(makeRef(column, row));
    }
  }
  return refs;
}

/** The cells a formula reads, used to know what to recompute after an edit. */
export function referencesOf(expr: Expr): string[] {
  switch (expr.kind) {
    case "number":
      return [];
    case "cell":
      return [expr.ref];
    case "range":
      return expandRange(expr.from, expr.to);
    case "call":
      return expr.args.flatMap(referencesOf);
    case "binary":
      return [...referencesOf(expr.left), ...referencesOf(expr.right)];
    case "negate":
      return referencesOf(expr.operand);
  }
}

type Functions = Record<string, (args: number[]) => number>;

const sum = (args: number[]) => args.reduce((a, b) => a + b, 0);

const FUNCTIONS: Functions = {
  SUM: sum,
  ADD: sum,
  PROD: (args) => args.reduce((a, b) => a * b, 1),
  MUL: (args) => args.reduce((a, b) => a * b, 1),
  SUB: (args) => {
    if (args.length !== 2) throw new FormulaError("SUB takes two arguments");
    return args[0] - args[1];
  },
  DIV: (args) => {
    if (args.length !== 2) throw new FormulaError("DIV takes two arguments");
    if (args[1] === 0) throw new FormulaError("division by zero");
    return args[0] / args[1];
  },
  MIN: (args) => {
    if (args.length === 0) throw new FormulaError("MIN needs at least one argument");
    return Math.min(...args);
  },
  MAX: (args) => {
    if (args.length === 0) throw new FormulaError("MAX needs at least one argument");
    return Math.max(...args);
  },
  AVG: (args) => {
    if (args.length === 0) throw new FormulaError("AVG needs at least one argument");
    return sum(args) / args.length;
  },
};

export const FUNCTION_NAMES = Object.keys(FUNCTIONS);

/**
 * Evaluates an expression. `lookup` resolves a cell reference to a number and
 * is where cycle detection lives, so the evaluator itself stays pure.
 */
export function evaluate(expr: Expr, lookup: (ref: string) => number): number {
  switch (expr.kind) {
    case "number":
      return expr.value;
    case "cell":
      return lookup(expr.ref);
    case "range":
      throw new FormulaError("a range is only allowed as a function argument");
    case "negate":
      return -evaluate(expr.operand, lookup);
    case "binary": {
      const left = evaluate(expr.left, lookup);
      const right = evaluate(expr.right, lookup);
      switch (expr.op) {
        case "+":
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          if (right === 0) throw new FormulaError("division by zero");
          return left / right;
      }
      break;
    }
    case "call": {
      const fn = FUNCTIONS[expr.name];
      if (!fn) throw new FormulaError(`unknown function "${expr.name}"`);
      const args = expr.args.flatMap((arg) =>
        arg.kind === "range"
          ? expandRange(arg.from, arg.to).map(lookup)
          : [evaluate(arg, lookup)],
      );
      return fn(args);
    }
  }
  throw new FormulaError("unreachable");
}
