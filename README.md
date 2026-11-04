This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Task list

The home page lets you add tasks and check them complete (or uncheck them).
Tasks and completion state are saved under `azilll.tasks.v1` in browser localStorage.
They survive reloads in the same browser and origin; there is no account, server database,
or cross-device sync. Clearing site data removes saved tasks.

Blank tasks are rejected. Storage failures are shown explicitly without claiming a
change was saved. Unreadable stored data is preserved and task editing is disabled
rather than silently replacing it.

## Verification

```bash
npm install
npx playwright install chromium
npm test
npm run lint
npm run typecheck
npm run build
```

Playwright starts the development server when necessary and tests desktop and mobile
Chromium. Tests cover adding multiple tasks, trimming input, completion and reopening,
persistence after reload, blank-input validation, corrupt storage, and save failures.
No service keys are required.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
