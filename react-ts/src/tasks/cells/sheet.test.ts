import { describe, expect, it } from "vitest";
import { createEvaluator, formatValue, type Sheet } from "./sheet";
import { expandRange, parseFormula } from "./formula";

const render = (sheet: Sheet, ref: string) => formatValue(createEvaluator(sheet).valueAt(ref));

describe("cell contents", () => {
  it("classifies empty, numeric and textual cells", () => {
    const sheet: Sheet = { A0: "", A1: "42", A2: "hello" };
    expect(render(sheet, "A0")).toBe("");
    expect(render(sheet, "A1")).toBe("42");
    expect(render(sheet, "A2")).toBe("hello");
    expect(render(sheet, "Z99")).toBe("");
  });
});

describe("formulas", () => {
  it("does arithmetic with precedence and parentheses", () => {
    expect(render({ A0: "=2+3*4" }, "A0")).toBe("14");
    expect(render({ A0: "=(2+3)*4" }, "A0")).toBe("20");
    expect(render({ A0: "=-3+1" }, "A0")).toBe("-2");
  });

  it("reads other cells, treating empty ones as zero", () => {
    const sheet: Sheet = { A0: "2", A1: "3", B0: "=A0*A1", B1: "=B0+C9" };
    expect(render(sheet, "B0")).toBe("6");
    expect(render(sheet, "B1")).toBe("6");
  });

  it("is case insensitive about references and function names", () => {
    expect(render({ A0: "5", B0: "=sum(a0, 1)" }, "B0")).toBe("6");
  });

  it("applies functions over ranges", () => {
    const sheet: Sheet = { A0: "1", A1: "2", A2: "3", B0: "=SUM(A0:A2)", B1: "=AVG(A0:A2)" };
    expect(render(sheet, "B0")).toBe("6");
    expect(render(sheet, "B1")).toBe("2");
  });

  it("propagates a change through a chain of dependents", () => {
    const before: Sheet = { A0: "1", A1: "=A0+1", A2: "=A1+1" };
    expect(render(before, "A2")).toBe("3");
    expect(render({ ...before, A0: "10" }, "A2")).toBe("12");
  });

  it("reports division by zero", () => {
    expect(render({ A0: "=1/0" }, "A0")).toBe("#division by zero");
  });

  it("reports a reference to text", () => {
    expect(render({ A0: "hi", B0: "=A0+1" }, "B0")).toBe("#A0 is not a number");
  });

  it("reports an error read through another formula", () => {
    const sheet: Sheet = { A0: "hi", B0: "=A0+1", C0: "=B0+1" };
    expect(render(sheet, "C0")).toContain("#B0:");
  });

  it("reports direct and indirect cycles instead of hanging", () => {
    expect(render({ A0: "=A0" }, "A0")).toBe("#circular reference");
    expect(render({ A0: "=B0", B0: "=A0" }, "A0")).toBe("#circular reference");
    expect(render({ A0: "=B0", B0: "=C0", C0: "=A0" }, "B0")).toBe("#circular reference");
  });

  it("rejects malformed formulas", () => {
    expect(render({ A0: "=1+" }, "A0")).toContain("#");
    expect(render({ A0: "=nope(1)" }, "A0")).toBe('#unknown function "NOPE"');
    expect(render({ A0: "=A0:A2" }, "A0")).toContain("range");
  });
});

describe("ranges", () => {
  it("expands rectangles in either corner order", () => {
    expect(expandRange("A0", "B1")).toEqual(["A0", "A1", "B0", "B1"]);
    expect(expandRange("B1", "A0")).toEqual(["A0", "A1", "B0", "B1"]);
  });
});

describe("parsing", () => {
  it("builds the expected tree for a function call over a range", () => {
    expect(parseFormula("SUM(A0:A2)")).toEqual({
      kind: "call",
      name: "SUM",
      args: [{ kind: "range", from: "A0", to: "A2" }],
    });
  });
});
