# Little list

A browser-local task list built with Next.js and React. Add a trimmed, nonblank task, complete it or reopen it, and see total, active and completed counts.

## Development

```bash
npm install
npm run dev -- --hostname 0.0.0.0
```

## Verification

```bash
npm run lint
npm run typecheck
npm run build
# Run against an already running app:
BASE_URL=http://localhost:3000 npm run test:e2e
```

Playwright covers desktop Chromium and a mobile Chromium viewport. Each test has isolated browser storage.

## Baseline reconciliation

This session's branch started from the template rather than the accepted task-list implementation. The baseline source and regression tests were recovered from PR #2 (commit `0bcc1107bf6ad40ab9b76a95558dad8d9f29d89a`), which is open and unmerged. This branch therefore targets `main` and restores that implementation before extending it. The storage key `azilll.tasks.v1` and task shape `{ id, text, isComplete }` remain compatible.

There are no accepted design or architecture artifacts. The prior responsive styling is preserved; formal mockup comparison remains unavailable.

## Data

Tasks stay in localStorage on the current browser and origin. There is no account or server sync. Storage failures are shown explicitly; unreadable stored data is not overwritten. The saved confirmation is suppressed on read or write errors. A failed change leaves both the previous list and its stored value intact; retrying after storage recovers can save the change. Invalid JSON, invalid task shapes, blank text and duplicate IDs block writes to protect existing data. A preview on another origin does not have access to an earlier preview's tasks.
