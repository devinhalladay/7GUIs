import { Counter } from "./tasks/Counter";
import { TemperatureConverter } from "./tasks/TemperatureConverter";
import { FlightBooker } from "./tasks/FlightBooker";
import { Timer } from "./tasks/Timer";
import { Crud } from "./tasks/Crud";
import { CircleDrawer } from "./tasks/CircleDrawer";
import { Cells } from "./tasks/cells/Cells";
import { useHashRoute } from "./useHashRoute";

type Task = {
  slug: string;
  title: string;
  challenge: string;
  Component: () => React.JSX.Element;
};

const TASKS: Task[] = [
  {
    slug: "counter",
    title: "1. Counter",
    challenge: "Understanding the basic ideas of a language/toolkit.",
    Component: Counter,
  },
  {
    slug: "temperature-converter",
    title: "2. Temperature Converter",
    challenge: "Bidirectional data flow, user-provided text input.",
    Component: TemperatureConverter,
  },
  {
    slug: "flight-booker",
    title: "3. Flight Booker",
    challenge: "Constraints between widgets.",
    Component: FlightBooker,
  },
  {
    slug: "timer",
    title: "4. Timer",
    challenge: "Concurrency, competing user/signal interactions, responsiveness.",
    Component: Timer,
  },
  {
    slug: "crud",
    title: "5. CRUD",
    challenge: "Separating the domain from the presentation, managing mutation.",
    Component: Crud,
  },
  {
    slug: "circle-drawer",
    title: "6. Circle Drawer",
    challenge: "Undo/redo, custom drawing, dialog control.",
    Component: CircleDrawer,
  },
  {
    slug: "cells",
    title: "7. Cells",
    challenge: "Change propagation, widget customization, implementing a more complex layout.",
    Component: Cells,
  },
];

export function App() {
  const route = useHashRoute();
  const task = TASKS.find((t) => t.slug === route) ?? TASKS[0];

  return (
    <div className="app">
      <header className="app-header">
        <h1>7GUIs in React</h1>
        <p>
          The same seven tasks as <code>../reagent-cljs</code>, written with React function
          components and hooks. Task descriptions live at{" "}
          <a href="https://eugenkiss.github.io/7guis/tasks">eugenkiss.github.io/7guis</a>.
        </p>
      </header>

      <nav className="task-nav">
        {TASKS.map((t) => (
          <a
            key={t.slug}
            href={`#/${t.slug}`}
            className={t.slug === task.slug ? "task-link current" : "task-link"}
            aria-current={t.slug === task.slug ? "page" : undefined}
          >
            {t.title}
          </a>
        ))}
      </nav>

      <main className="task">
        <h2>{task.title}</h2>
        <p className="challenge">{task.challenge}</p>
        <task.Component />
      </main>
    </div>
  );
}
