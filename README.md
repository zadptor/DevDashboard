# DevCommand

DevCommand is a React + TypeScript dashboard for tracking tasks, Jira items, GitHub pull requests, SAP CATS reports, and planning poker sessions. It uses Firebase auth, a persisted client store, and an Express/Vite server that proxies GitHub and Jira requests.

## Features

- Google sign-in with Firebase authentication
- Demo mode for local preview without authentication
- Dashboard overview with task, PR, and time summaries
- Task management with persisted Zustand state
- Jira sync and SAP CATS reporting flows
- GitHub pull request views backed by server-side proxy routes
- Planning poker dashboard and public poker room route
- Theme support for `light`, `dark`, `system`, and `jarvis`

## Tech Stack

- React 19
- TypeScript
- Vite 6
- Express
- Firebase Auth and Firestore
- Zustand for client state
- TanStack React Query
- React Router
- Tailwind CSS 4
- shadcn/ui primitives
- Lucide icons
- date-fns, axios, exceljs, jsPDF, motion

## Repository Structure

```text
.
|-- server.ts                # Express server, API proxies, Vite middleware in dev
|-- src/
|   |-- App.tsx              # App shell, routing, auth gate, theme selection
|   |-- main.tsx             # React entrypoint
|   |-- store.ts             # Persisted Zustand store
|   |-- types.ts             # Shared TypeScript types
|   |-- lib/                 # Firebase and auth helpers
|   `-- views/               # Route-level screens
|-- components/ui/           # shadcn/ui-based building blocks
|-- firestore.rules          # Firestore security rules
|-- firebase-applet-config.json
|-- assets/
`-- attached_assets/
```

## Getting Started

### Prerequisites

- Node.js
- npm

### Install

```bash
npm install
```

### Environment

Create a local `.env` file from `.env.example` and provide the required values:

- `GEMINI_API_KEY`
- `APP_URL`
- `GITHUB_ACCESS_TOKEN`
- `JIRA_API_TOKEN`
- `JIRA_USER_EMAIL`
- `JIRA_DOMAIN`

The server reads environment variables through `dotenv`. The client also uses the checked-in Firebase config in `firebase-applet-config.json`.

### Run

```bash
npm run dev
```

The app runs on `http://localhost:5000` by default.

### Build

```bash
npm run build
```

This builds the Vite client and bundles `server.ts` into `dist/server.cjs`.

### Start Production Build

```bash
npm run start
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the local dev server with Vite middleware |
| `npm run build` | Build the client and server bundle |
| `npm run start` | Run the production server from `dist/server.cjs` |
| `npm run lint` | Type-check the project with `tsc --noEmit` |

## Code Conventions

- Use TypeScript for application code and shared types.
- Keep route-level UI in `src/views` and shared primitives in `components/ui`.
- Prefer functional React components and hooks.
- Use the `@/*` path alias defined in `tsconfig.json` and `vite.config.ts`.
- Use Tailwind utility classes for styling and theme tokens from `src/index.css`.
- Keep persisted client state in `src/store.ts` and limit direct `localStorage` access to startup or explicit flows.
- Use server-side proxy routes in `server.ts` for GitHub and Jira API access instead of calling those services directly from the browser.

## Testing

There is no committed automated test runner yet.

Current verification options:

- `npm run lint` for TypeScript validation
- Manual smoke test of the main routes:
  - `/`
  - `/tasks`
  - `/timeline`
  - `/prs`
  - `/poker`
  - `/reports`
  - `/settings`

## Notes

- Authentication is handled through Firebase Google sign-in.
- Demo mode stores a `devMode=true` flag in `localStorage`.
- GitHub and Jira requests are proxied through the Node server so tokens can be supplied from environment variables or request headers.
- The `jarvis` theme is defined in `src/index.css`.
