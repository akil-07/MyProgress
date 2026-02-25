---
description: How to build a personal Notion-like app (rich editor + databases + sidebar)
---

# 🗂️ Build My Personal Notion App — Workflow

## Tech Stack
- **Frontend**: React (Vite)
- **Editor**: TipTap v2
- **Backend**: Firebase (Firestore + Auth)
- **Styling**: Vanilla CSS with CSS Variables
- **State**: Zustand
- **Drag & Drop**: @dnd-kit/core

---

## PHASE 1 — Project Setup

### Step 1: Initialize Vite + React project
```bash
npx -y create-vite@latest ./ --template react
```

### Step 2: Install all dependencies
```bash
npm install
npm install firebase zustand @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-task-list @tiptap/extension-task-item @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-highlight @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-router-dom uuid
```

### Step 3: Setup Firebase project
1. Go to https://console.firebase.google.com
2. Create a new project (call it "my-notion")
3. Enable **Authentication** → Google Sign-In
4. Enable **Firestore Database** → Start in test mode
5. Copy your Firebase config into `src/services/firebase.js`

### Step 4: Create firebase.js service file
Create `src/services/firebase.js` with your Firebase config:
```js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = { /* paste your config here */ };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
```

### Step 5: Setup Firestore data structure
Collections:
- `users/{userId}/pages/{pageId}` — each page document
  - `title: string`
  - `icon: string (emoji)`
  - `content: JSON (TipTap doc)`
  - `parentId: string | null`
  - `order: number`
  - `createdAt: timestamp`
  - `updatedAt: timestamp`

---

## PHASE 2 — Auth & Sidebar

### Step 6: Build Google Sign-In page
Create `src/pages/Login.jsx` with Google OAuth button.

### Step 7: Build Sidebar component
Create `src/components/Sidebar/Sidebar.jsx`:
- Shows nested page tree from Firestore
- "New Page" button → creates a blank page
- Click on page name → navigate to `/doc/:pageId`
- Right-click context menu → Rename, Delete
- Drag-to-reorder pages using @dnd-kit

### Step 8: Build routing
Use `react-router-dom` in `App.jsx`:
- `/` → redirect to first page or home
- `/login` → Login page
- `/doc/:pageId` → Document editor

---

## PHASE 3 — Rich Text Editor

### Step 9: Build the Editor component
Create `src/components/Editor/Editor.jsx` using TipTap:
```jsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
```

### Step 10: Add Slash command menu
When user types `/`, show a floating command menu with options:
- Heading 1, Heading 2, Heading 3
- Bullet list, Numbered list
- To-do list (checkbox)
- Code block
- Quote

### Step 11: Auto-save to Firestore
Use a debounced `useEffect` that watches editor content and saves to Firestore every 1 second after the user stops typing.

---

## PHASE 4 — Database Views (Optional Advanced)

### Step 12: Table/Grid database view
Create `src/components/Database/TableView.jsx`:
- Each row is a Firestore document in a subcollection
- Properties: text, number, select, checkbox, date

### Step 13: Kanban board view
Create `src/components/Database/KanbanView.jsx`:
- Columns based on a "Select" property
- Drag cards between columns using @dnd-kit

---

## PHASE 5 — Polish

### Step 14: Dark/Light mode
Use CSS variables in `index.css`:
```css
:root {
  --bg: #ffffff;
  --text: #1a1a1a;
}
[data-theme="dark"] {
  --bg: #191919;
  --text: #e8e8e8;
}
```
Toggle with a button that sets `data-theme` on `<html>`.

### Step 15: Page icons and covers
- Click emoji icon next to title → emoji picker
- Add cover image at top of page (random Unsplash image or upload)

### Step 16: Search
- Add a command palette (⌘+K) 
- Search through all page titles in Firestore

### Step 17: PWA Setup
Add `vite-plugin-pwa` to make the app installable on desktop/mobile.

---

## Running the App

```bash
npm run dev
```
Open http://localhost:5173

## Firestore Rules (for production)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## Key Files to Create
- `src/services/firebase.js` — Firebase init
- `src/store/pageStore.js` — Zustand store for pages
- `src/components/Sidebar/Sidebar.jsx` — Left nav
- `src/components/Editor/Editor.jsx` — TipTap editor
- `src/components/Editor/SlashMenu.jsx` — Command palette
- `src/pages/Login.jsx` — Auth page
- `src/pages/Document.jsx` — Page wrapper
- `src/styles/index.css` — Global styles & design tokens
