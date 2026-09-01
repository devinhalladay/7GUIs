# 7GUIs in React

The [seven tasks](https://eugenkiss.github.io/7guis/tasks) again, this time in React
(function components + hooks) and TypeScript, as a counterpart to the Reagent/ClojureScript
version in [`../reagent-cljs`](../reagent-cljs).

## Running it

```
npm install
npm run dev      # http://localhost:3450
npm test         # formula engine + date parsing
npm run build    # typecheck, then production bundle in dist/
```

There is no backend: it is a Vite single-page app with hash routing, one task per fragment
(`#/counter`, `#/cells`, …).

## Layout

```
src/
  App.tsx                    task registry + nav
  useHashRoute.ts            useSyncExternalStore over `hashchange`
  tasks/
    Counter.tsx
    TemperatureConverter.tsx
    FlightBooker.tsx         + parseDate/formatDate, covered by flightBooker.test.ts
    Timer.tsx
    Crud.tsx
    CircleDrawer.tsx
    cells/
      formula.ts             tokenizer, recursive-descent parser, evaluator
      sheet.ts               cell classification, memoized evaluation, cycle detection
      Cells.tsx              grid, formula bar, keyboard handling
      sheet.test.ts
```

## Notes on the tricky ones

**Flight Booker** uses the `DD.MM.YYYY` text fields the spec calls for rather than
`<input type="date">` — validating the text is the point of the task. `parseDate` rejects
dates that do not exist instead of letting `new Date` roll `31.02.2026` over into March.

**Timer** derives `running` from `elapsed < duration` rather than storing it, so dragging the
duration slider past the elapsed time restarts the timer and pulling it back below stops it,
with no extra state to keep in sync.

**Circle Drawer** keeps undo/redo as a list of whole-canvas snapshots plus a cursor. The
diameter dialog previews changes without touching that list and appends a single snapshot when
it closes, which is what makes one undo revert the whole resize.

**Cells** supports the spec's grammar (numbers, `A0`-style references, `A0:B3` ranges and
function application) plus infix arithmetic and parentheses; functions are SUM, PROD, ADD, SUB,
MUL, DIV, MIN, MAX and AVG. Change propagation is a memoized recursive evaluator rather than an
explicit dependency graph: a fresh evaluator is built per edit, cells are computed on demand,
and a reference that comes back to a cell already being computed is reported as
`#circular reference` instead of overflowing the stack. That is O(sheet) per edit rather than
O(dependents), which a 26×100 grid does not notice; a dependency graph would be the move if it
had to scale.
