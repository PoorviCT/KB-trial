"use client";

import { useEffect, useReducer, useRef, useState, type FormEvent } from "react";

type Task = { id: string; text: string; isComplete: boolean };
type TaskFilter = "All" | "Active" | "Completed";
const TASK_FILTERS: TaskFilter[] = ["All", "Active", "Completed"];
type TaskState = { tasks: Task[]; isReady: boolean; hasStorageError: boolean };
const STORAGE_KEY = "azilll.tasks.v1";

function updateTaskState(_state: TaskState, next: TaskState): TaskState {
  return next;
}

function isTaskList(value: unknown): value is Task[] {
  if (!Array.isArray(value)) return false;
  const ids = new Set<string>();
  return value.every((task) => {
    if (!task || typeof task.id !== "string" || !task.id ||
        typeof task.text !== "string" || !task.text.trim() ||
        typeof task.isComplete !== "boolean" || ids.has(task.id)) return false;
    ids.add(task.id);
    return true;
  });
}

export default function Home() {
  const [state, dispatch] = useReducer(updateTaskState, {
    tasks: [], isReady: false, hasStorageError: false,
  });
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [hasSaveError, setHasSaveError] = useState(false);
  const [filter, setFilter] = useState<TaskFilter>("All");
  const [feedback, setFeedback] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const tasks: unknown = stored === null ? [] : JSON.parse(stored);
      if (!isTaskList(tasks)) {
        dispatch({ tasks: [], isReady: true, hasStorageError: true });
        return;
      }
      dispatch({ tasks, isReady: true, hasStorageError: false });
    } catch {
      dispatch({ tasks: [], isReady: true, hasStorageError: true });
    }
  }, []);

  function saveTasks(tasks: Task[]): boolean {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      dispatch({ tasks, isReady: true, hasStorageError: false });
      setError("");
      setHasSaveError(false);
      return true;
    } catch {
      setHasSaveError(true);
      setError("Your change could not be saved. Check that browser storage is available, then try again.");
      return false;
    }
  }

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    if (!text.trim()) {
      setError("Enter a task before adding it.");
      inputRef.current?.focus();
      return;
    }
    if (saveTasks([...state.tasks, {
      id: crypto.randomUUID(), text: text.trim(), isComplete: false,
    }])) {
      setText("");
      setFeedback(`Added “${text.trim()}” as an active task.${filter === "Completed" ? " Select Active or All to see it." : ""}`);
      inputRef.current?.focus();
    }
  }

  function toggleTask(id: string) {
    setFeedback("");
    saveTasks(state.tasks.map((task) => task.id === id
      ? { ...task, isComplete: !task.isComplete } : task));
  }

  const completedCount = state.tasks.filter((task) => task.isComplete).length;
  const activeCount = state.tasks.length - completedCount;
  const isDisabled = !state.isReady || state.hasStorageError;
  const visibleTasks = state.tasks.filter((task) => filter === "All"
    || (filter === "Completed" ? task.isComplete : !task.isComplete));

  return (
    <main className="page">
      <header className="brand"><span className="brand-mark" aria-hidden="true">✓</span> Little list</header>
      <section className="task-panel" aria-labelledby="page-title">
        <div className="eyebrow">A LITTLE FOCUS, EVERY DAY</div>
        <h1 id="page-title">Your tasks.</h1>
        <p className="intro">Make room for what matters. One task at a time.</p>

        <form onSubmit={addTask} noValidate>
          <label htmlFor="new-task">Add a task</label>
          <div className="add-row">
            <input ref={inputRef} id="new-task" name="task" value={text}
              onChange={(event) => { setText(event.target.value); setError(""); setFeedback(""); }}
              placeholder="What needs to get done?" maxLength={500}
              disabled={isDisabled} aria-invalid={Boolean(error)}
              aria-describedby={error ? "task-error" : undefined} autoComplete="off" />
            <button type="submit" disabled={isDisabled}><span aria-hidden="true">＋</span> Add task</button>
          </div>
          {error && <p id="task-error" className="error" role="alert">{error}</p>}
          <p className="task-feedback" role="status" aria-label="Task feedback">{feedback}</p>
        </form>

        {state.hasStorageError && <p className="error storage-error" role="alert">
          We couldn’t read your saved tasks. Your stored data has not been changed.
          Restore browser storage access or repair the saved data, then reload this page.
        </p>}

        <div className="list-heading">
          <h2>My tasks <span className="count">{state.tasks.length}</span></h2>
          <span>{completedCount} of {state.tasks.length} complete</span>
        </div>
        <p className="task-counts" role="status" aria-label="Task counts">
          {state.tasks.length} total · {activeCount} active · {completedCount} completed
        </p>
        <div className="task-filters" role="group" aria-label="Filter tasks by status">
          {TASK_FILTERS.map((option) => <button key={option} type="button"
            aria-pressed={filter === option} aria-controls="task-results"
            onClick={() => { setFilter(option); setFeedback(""); }}>{option}</button>)}
        </div>
        <div id="task-results">
        {!state.isReady ? <p className="empty-copy" role="status">Loading your tasks…</p>
          : visibleTasks.length === 0 ? <div className="empty-state" role="status" aria-label="Task view">
              <span className="empty-icon" aria-hidden="true">✓</span>
              <h3>{filter === "Active" ? "No active tasks." : filter === "Completed" ? "No completed tasks yet." : "A fresh start."}</h3>
              <p>{filter === "Active" ? "You’re all caught up. Add a task above or view All."
                : filter === "Completed" ? "Completed tasks will appear here. Select Active to work on a task."
                : <>Add your first task above.<br />Small steps make a big difference.</>}</p>
            </div>
          : <ul className="task-list">
              {visibleTasks.map((task) => <li key={task.id} className={task.isComplete ? "is-complete" : ""}>
                <label className="task-item">
                  <input type="checkbox" checked={task.isComplete}
                    onChange={() => toggleTask(task.id)} disabled={isDisabled} />
                  <span>{task.text}</span>
                </label>
              </li>)}
            </ul>}
        </div>
        <footer className="storage-note">
          <span aria-hidden="true">↳</span>{" "}
          {!state.isReady ? "Checking browser storage…"
            : state.hasStorageError ? "Saved data is protected. Reload after resolving the read error."
            : hasSaveError ? "Last change not saved. Your previous saved tasks are unchanged."
            : "Saved in this browser. Still here when you return."}
        </footer>
      </section>
      <p className="page-note">Less noise. More done.</p>
    </main>
  );
}
