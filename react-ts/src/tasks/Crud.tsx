import { useMemo, useState } from "react";

type Person = { id: number; name: string; surname: string };

const INITIAL: Person[] = [
  { id: 1, name: "Hans", surname: "Emil" },
  { id: 2, name: "Max", surname: "Mustermann" },
  { id: 3, name: "Roman", surname: "Tisch" },
];

/**
 * Task 5 — CRUD.
 * The list is the domain state; the two text fields are a scratch buffer that
 * only writes back into the list when Create or Update is pressed.
 */
export function Crud() {
  const [people, setPeople] = useState<Person[]>(INITIAL);
  const [nextId, setNextId] = useState(INITIAL.length + 1);
  const [filter, setFilter] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");

  const visible = useMemo(() => {
    const prefix = filter.trim().toLowerCase();
    return people.filter((p) => p.surname.toLowerCase().startsWith(prefix));
  }, [people, filter]);

  // A selection that the filter has hidden no longer counts as selected.
  const selected = visible.find((p) => p.id === selectedId) ?? null;
  const named = name.trim() !== "" || surname.trim() !== "";

  function select(person: Person) {
    setSelectedId(person.id);
    setName(person.name);
    setSurname(person.surname);
  }

  function create() {
    setPeople([...people, { id: nextId, name: name.trim(), surname: surname.trim() }]);
    setNextId(nextId + 1);
  }

  function update() {
    if (!selected) return;
    setPeople(
      people.map((p) =>
        p.id === selected.id ? { ...p, name: name.trim(), surname: surname.trim() } : p,
      ),
    );
  }

  function remove() {
    if (!selected) return;
    setPeople(people.filter((p) => p.id !== selected.id));
    setSelectedId(null);
    setName("");
    setSurname("");
  }

  return (
    <div className="crud">
      <label className="field">
        <span>Filter prefix</span>
        <input type="text" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </label>

      <ul className="listbox" role="listbox" aria-label="People">
        {visible.map((person) => (
          <li
            key={person.id}
            role="option"
            aria-selected={person.id === selected?.id}
            className={person.id === selected?.id ? "selected" : undefined}
            onClick={() => select(person)}
          >
            {person.surname}, {person.name}
          </li>
        ))}
        {visible.length === 0 && <li className="empty">No matches</li>}
      </ul>

      <div className="stack">
        <label className="field">
          <span>Name</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          <span>Surname</span>
          <input type="text" value={surname} onChange={(e) => setSurname(e.target.value)} />
        </label>
      </div>

      <div className="row crud-buttons">
        <button onClick={create} disabled={!named}>
          Create
        </button>
        <button onClick={update} disabled={!selected || !named}>
          Update
        </button>
        <button onClick={remove} disabled={!selected}>
          Delete
        </button>
      </div>
    </div>
  );
}
