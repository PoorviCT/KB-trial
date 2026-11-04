"use client";

import { useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from "react";

type Task = { id: string; title: string; isComplete: boolean };
const STORAGE_KEY = "azilll.tasks.v1";
const CHANGE_EVENT = "azilll:tasks-changed";
const READ_ERROR = "__storage_unavailable__";

function subscribeToTasks(onChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY || event.key === null) onChange();
  }
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function readSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return READ_ERROR;
  }
}

function readServerSnapshot() { return null; }

function parseTasks(snapshot: string | null): { tasks: Task[]; hasReadError: boolean } {
  if (!snapshot) return { tasks: [], hasReadError: false };
  try {
    const tasks: unknown = JSON.parse(snapshot);
    if (!Array.isArray(tasks) || !tasks.every((task) =>
      typeof task === "object" && task !== null &&
      typeof task.id === "string" && typeof task.title === "string" &&
      typeof task.isComplete === "boolean"
    )) return { tasks: [], hasReadError: true };
    if (new Set(tasks.map((task) => task.id)).size !== tasks.length) {
      return { tasks: [], hasReadError: true };
    }
    return { tasks, hasReadError: false };
  } catch {
    return { tasks: [], hasReadError: true };
  }
}

export default function Home() {
  const snapshot = useSyncExternalStore(subscribeToTasks, readSnapshot, readServerSnapshot);
  const { tasks, hasReadError } = useMemo(() => parseTasks(snapshot), [snapshot]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isLoading = snapshot === null;
  const completedCount = tasks.filter((task) => task.isComplete).length;

  function saveTasks(nextTasks: Task[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks));
    } catch {
      setError("Your change could not be saved. Check your browser storage settings and try again.");
      return false;
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
    setError("");
    return true;
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hasReadError || isLoading) return;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Enter a task before adding it.");
      inputRef.current?.focus();
      return;
    }
    if (saveTasks([...tasks, { id: crypto.randomUUID(), title: trimmedTitle, isComplete: false }])) {
      setTitle("");
      inputRef.current?.focus();
    }
  }

  function toggleTask(id: string) {
    saveTasks(tasks.map((task) => task.id === id ? { ...task, isComplete: !task.isComplete } : task));
  }

  return (
    <main className="workspace">
      <header className="brand"><span className="brand-mark" aria-hidden="true">✓</span> azilll <span className="brand-caption">A little more done.</span></header>
      <section className="task-card" aria-labelledby="page-title">
        <div className="card-heading">
          <p className="eyebrow">MAKE ROOM FOR WHAT MATTERS</p>
          <h1 id="page-title">Your tasks, simplified.</h1>
          <p className="intro">One small step at a time. Add a task, then check it off.</p>
        </div>
        <form onSubmit={addTask} className="task-form">
          <label htmlFor="new-task">New task</label>
          <div className="input-row">
            <input ref={inputRef} id="new-task" placeholder="What would you like to get done?" value={title} maxLength={240}
              disabled={isLoading || hasReadError} aria-invalid={Boolean(error)} aria-describedby={error || hasReadError ? "task-error" : undefined}
              onChange={(event) => { setTitle(event.target.value); setError(""); }} />
            <button disabled={isLoading || hasReadError} type="submit"><span aria-hidden="true">＋</span> Add task</button>
          </div>
        </form>
        {(error || hasReadError) && <p role="alert" id="task-error" className="error">{hasReadError ? "Your saved tasks could not be loaded. Nothing has been overwritten. Check your browser storage settings or restore the saved data, then reload." : error}</p>}
        <div className="list-heading">
          <h2>My tasks <span className="task-count">{tasks.length}</span></h2>
          <span className="progress" role="status">{completedCount} of {tasks.length} complete</span>
        </div>
        {isLoading ? <p className="empty-state" role="status">Loading your tasks…</p> : hasReadError ? null : tasks.length === 0 ? (
          <div className="empty-state"><span className="empty-icon" aria-hidden="true">✓</span><h3>No tasks yet</h3><p>A clear list. A fresh start.<br />Add your first task above.</p></div>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => <li key={task.id} className={task.isComplete ? "task is-complete" : "task"}>
              <label><input type="checkbox" checked={task.isComplete} onChange={() => toggleTask(task.id)} /><span>{task.title}</span></label>
              {task.isComplete && <span className="done-badge" aria-hidden="true">Done</span>}
            </li>)}
          </ul>
        )}
        <footer className="storage-note"><span aria-hidden="true">◈</span> Saved in this browser. Your tasks stay here after a reload.</footer>
      </section>
      <p className="page-footer">Less to keep in your head. More space for your day.</p>
    </main>
  );
}
