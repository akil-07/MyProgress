# MyNotion

MyNotion is a personal productivity workspace built with React and Vite. It combines rich note-taking, task tracking, academic planning, attendance forecasting, a Pomodoro timer, AI assistance, and a GitHub-based record note generator inside one student-focused app.

## What the project includes

- Rich document workspace with nested pages, icons, autosave, and an editor-driven writing flow
- Google sign-in with Firebase Authentication
- Firestore sync for pages, tasks, and academic data when Firebase is configured
- Local persistence with Zustand and `localStorage` so the app still works without cloud sync
- Task management with categories, completion history, and streak tracking
- Academic tools for attendance calculation, timetable planning, semester events, and assignments
- AI assistant support using Cerebras, plus Gemini-powered document helpers
- Record Note generator that imports GitHub repositories and formats them into a printable PDF-style sheet with QR codes
- Responsive dashboard layout with sidebar navigation, profile page, and music player

## Tech stack

- React 19
- Vite 7
- React Router 7
- Zustand for client state
- Firebase Auth + Firestore
- TipTap editor
- Cerebras API
- Google Gemini API
- `html2canvas` and `jspdf`

## Main sections

- `Documents`: create and edit workspace pages
- `Tasks`: manage todos, categories, and streaks
- `Attendance`: calculate current and projected attendance, bunk budget, and recovery effort
- `Timetable`: organize class slots and room details
- `Assignments`: track academic work by due date and priority
- `Semester Planner`: maintain semester dates and events
- `Pomodoro`: focus timer for study sessions
- `Record Generator`: build a printable record note from GitHub repositories
- `Profile`: user-facing account and workspace area

## Project structure

```text
my-notion/
|-- public/
|   `-- HEADER.png
|-- src/
|   |-- components/
|   |-- pages/
|   |-- services/
|   |-- store/
|   `-- styles/
|-- package.json
`-- README.md
```

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment variables

Add a `.env` file in the project root with the variables used by the app:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GEMINI_API_KEY=
VITE_CEREBRAS_API_KEY=
```

Notes:

- Firebase is optional in code, but Google login and Firestore sync require it
- Cerebras is required for the floating AI assistant
- Gemini is used for AI writing and summary helpers inside the document experience

### 3. Start the development server

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
```

### 5. Preview the production build

```bash
npm run preview
```

## Available scripts

- `npm run dev` starts the Vite dev server
- `npm run build` creates the production build
- `npm run lint` runs ESLint
- `npm run preview` previews the built app locally

## Data behavior

- Notes, tasks, streaks, timetable data, assignments, and semester details are stored locally with Zustand-backed `localStorage`
- When Firebase is configured and a user signs in, the app loads and syncs core workspace data through Firestore
- Sync is debounced to reduce unnecessary writes

## Record generator notes

- The record generator uses `public/HEADER.png` for the printable sheet header
- It can fetch repositories from the GitHub public API or accept manual entries
- Generated output is designed for print or PDF export from the browser

## Deployment

The project includes `vercel.json`, so it is prepared for Vercel-style frontend deployment. Make sure all required environment variables are configured in the deployment platform before publishing.

## Important setup note

The current repository already contains a `.env` file. If this project is shared publicly, rotate any real API keys and move sensitive values to secure environment management instead of committing them to source control.
