# Frontend — LTI Talent Tracking System

## Stack

React 18 + TypeScript 4.9 + Bootstrap 5 + Create React App

## First-time setup

1. `cd frontend && npm install`
2. `npm start` — dev server at http://localhost:3000

## Dev workflow

- `npm start` — CRA dev server with hot reload
- `npm run build` — production build to `build/`
- `npm test` — currently broken (see gotchas)

## Code conventions

- **Components**: functional with hooks, PascalCase filenames (`AddCandidateForm.js`)
- **Utilities**: camelCase filenames (`candidateService.js`)
- **UI text**: keep in Spanish — the entire UI is in Spanish
- **Exports**: always `export default` for components
- **API calls**: prefer `fetch()` for simple calls (used in components); `candidateService.js` uses `axios` (see gotcha)
- **State**: local `useState` only — no global state management
- **Styling**: Bootstrap 5 via `react-bootstrap` components + utility classes
- **Date picker**: use `react-datepicker` for date fields

## Architecture

```
src/
├── index.tsx                     Entry point (React 18 createRoot)
├── App.js                        Router: / → Dashboard, /add-candidate → Form
├── components/
│   ├── RecruiterDashboard.js     Landing page with LTI logo
│   ├── AddCandidateForm.js       Full candidate creation form
│   └── FileUploader.js           CV upload with progress
└── services/
    └── candidateService.js       Axios API client (needs axios installed)
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `RecruiterDashboard` | Landing page |
| `/add-candidate` | `AddCandidateForm` | Candidate creation form |

## Environment variables

- None currently defined — the backend URL is hardcoded as `http://localhost:3010` in 4 files
- If adding env vars, use the `REACT_APP_` prefix (CRA convention)

## Known gotchas

- **`axios` is missing from `package.json`** — `candidateService.js` imports it but it's not a dependency. Install with `npm install axios` before using that file.
- **`npm test` is broken** — the script points to `jest.config.js` which doesn't exist. Change it to `react-scripts test` if you need to run tests.
- **Dead code**: `src/App.tsx`, `src/App.css`, `src/logo.svg` — these are CRA boilerplate. The real app is `src/App.js`. Do not edit `.tsx` App.
- **No formatter** configured — Prettier is not set up. Be consistent with existing style (2-space indentation preferred).
- **Hardcoded API URL** in 4 places (`AddCandidateForm.js:76`, `FileUploader.js:23`, `candidateService.js:8,21`)

## Commit guidelines

- Format: `frontend: <description>` or `feat(frontend): <description>`
