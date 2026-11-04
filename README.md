# Little list

A responsive task list built with Next.js and React. Add tasks with the button or Enter, and use the checkbox to complete or reopen them.

Tasks and completion states persist in browser localStorage on this origin. No account or external service is required. Tasks do not sync between browsers or devices, and clearing site data removes them. Storage failures display an error without claiming the change was saved; unreadable saved data is not overwritten.

## Development

```sh
npm ci
npm run dev -- --hostname 0.0.0.0
```

## Verification

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Run browser tests against a running app. Set `BASE_URL` to test another origin; the default is localhost port 3000. Desktop and mobile Chromium scenarios cover creation, completion/reopening after reload, blank input, plain-text rendering, malformed stored data, and failed saves.

If building while the development server is running, restart the development server afterward to avoid stale framework build artifacts.
