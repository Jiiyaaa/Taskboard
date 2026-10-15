# Taskboard

A full-stack Kanban board. Create tasks, drag them between **To Do / In Progress / Done**, reorder them inside a column, and everything is saved to a database, so a refresh never loses your place.

| Light | Dark |
|---|---|
| ![Light theme](docs/board-light.jpg) | ![Dark theme](docs/board-dark.jpg) |

**Live demo:** _add your Vercel URL here_  
**API:** _add your Render URL here_`/api/health`

> The API runs on a free host that sleeps when idle, so the very first load can take up to a minute. The app tells you when that is happening.

---

## Features

**Core requirements**
- Three fixed columns with a **live task count** on each
- **Create, edit and delete** tasks: title (required), description (optional), priority Low / Medium / High
- **Priority is visible on the card**: coloured left edge, tinted background and a badge
- **Drag and drop** between columns and **reorder within a column** (mouse, touch and keyboard)
- **Persistent**: every move is saved; refreshing restores the exact same board
- **REST API** for CRUD and reorder, backed by **MongoDB**

**Bonus features (all three)**
- **Due dates** with automatic **overdue highlighting** (not shown as overdue once a task is Done)
- **Search and priority filter**
- **Activity log**: "Set up CI pipeline moved to Done, 2:30 PM", in a slide-over panel

**Details**
- Loading skeleton, empty states (per column and for "no filter matches"), friendly error screen with **Try again**, toast notifications
- Form validation on both client and server, with a character counter
- Light / dark theme (follows your system, remembers your choice)
- Responsive: columns stack on phones; touch drag uses press-and-hold so scrolling still works
- Keyboard friendly: `N` new task, `/` search, `Space` lifts a focused card, arrow keys move it, `Space` drops it (`Esc` cancels), `Enter` edits, `Esc` closes dialogs
- Overall progress bar (% of tasks done)

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 19, Vite, [dnd-kit](https://dndkit.com/) (`core` + `sortable`), plain CSS |
| Backend | Node.js, Express 5, Mongoose, Zod (validation), Helmet, CORS, rate limiting |
| Database | MongoDB (Atlas in production) |
| Tests | Node's built-in test runner + Supertest against an in-memory MongoDB |
| Hosting | Vercel (frontend), Render (API), MongoDB Atlas (database), all free tiers |

---

## Run it locally

Requirements: **Node.js 20+**. You do **not** need to install MongoDB.

```bash
git clone <this-repo-url>
cd taskboard
npm run install:all     # installs root, server and client dependencies
npm run dev             # starts API on :4000 and the web app on :5173
```

Open http://localhost:5173.

With no `MONGODB_URI` set, the server starts a local development MongoDB automatically and keeps its files in `server/.data`, so your data survives restarts. The first run downloads the MongoDB binary (large, one time only).

To use your own database (e.g. Atlas), copy `server/.env.example` to `server/.env` and set `MONGODB_URI`.

### Other commands

```bash
npm test         # 11 API tests (create, validation, move, reorder, delete, activity log)
npm run lint     # lint the client
npm run build    # production build of the client
```

---

## API

Base path `/api`. All bodies are JSON. Errors look like `{ "error": "Validation failed", "details": [{ "field": "title", "message": "Title is required" }] }`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/tasks` | All tasks, ordered by column then position |
| `POST` | `/tasks` | Create. Body: `title` (required), `description`, `priority`, `status`, `dueDate`. Added to the bottom of its column |
| `PUT` | `/tasks/:id` | Edit `title`, `description`, `priority`, `dueDate` (`null` clears the date) |
| `DELETE` | `/tasks/:id` | Delete; the remaining cards in that column are re-numbered |
| `PATCH` | `/tasks/:id/move` | **Reorder.** Body: `{ "status": "done", "index": 1 }`: put the task at that slot of that column |
| `GET` | `/activity` | Latest 50 events, newest first |
| `DELETE` | `/activity` | Clear the log |
| `GET` | `/health` | Liveness check used by the host |

Status values: `todo`, `in-progress`, `done`. Priorities: `low`, `medium`, `high`.

---

## Project structure

```
taskboard/
├── client/                     React app (Vite)
│   └── src/
│       ├── api.js              fetch wrapper + ApiError
│       ├── hooks/useBoard.js   all board state + server calls (optimistic moves)
│       ├── components/
│       │   ├── Board.jsx       DndContext: drag logic and collision detection
│       │   ├── Column.jsx      droppable column + SortableContext
│       │   ├── TaskCard.jsx    card UI + sortable wrapper
│       │   ├── TaskModal.jsx   create / edit form
│       │   └── ...             Header, FilterBar, ActivityDrawer, Toasts, etc.
│       └── utils.js            date helpers (overdue), filtering
├── server/
│   ├── src/
│   │   ├── app.js              Express app (middleware + routes)
│   │   ├── routes/tasks.js     CRUD + the move/reorder endpoint
│   │   ├── models/             Task, Activity (Mongoose)
│   │   ├── validation.js       Zod schemas
│   │   └── db.js               connection (Atlas, or a local dev DB)
│   └── test/tasks.test.js
└── render.yaml                 Render blueprint
```

---

## Decisions I made (and why)

1. **Ordering with an integer `position` per column.** Each task stores `status` and `position`. The move endpoint takes the target column and index, rebuilds that column's order and rewrites positions as 0, 1, 2… in one `bulkWrite`. It is simple to reason about, and the database always holds the exact order the user sees. I considered fractional ("LexoRank"-style) positions, which write only one document per move, but for a board this size the extra complexity isn't worth it.
2. **Optimistic UI.** While you drag, the UI already shows the new order; the server call happens in the background. If it fails, a toast appears and the board reloads from the server, so the UI can never stay out of sync. Moves are queued so they reach the server in the order you made them.
3. **dnd-kit over react-beautiful-dnd.** `react-beautiful-dnd` is deprecated. dnd-kit is maintained, supports touch and keyboard, and gives full control over collision detection.
4. **Server is the source of truth for validation.** Zod validates every request; the client validates too, only for instant feedback. Invalid ids return 400, missing tasks 404.
5. **Activity log stores a snapshot of the title**, so entries stay readable after a task is renamed or deleted. Reordering inside the same column is deliberately not logged (it would be noise).
6. **Due dates are date-only.** They are stored as UTC midnight and displayed by reading the calendar day directly, so a task due "Oct 20" shows Oct 20 in every time zone.
7. **A zero-setup dev database.** `npm run dev` works without installing MongoDB. The dev-only dependency is imported lazily, so production never needs it, and production refuses to start without `MONGODB_URI`.
8. **Plain CSS with design tokens** (CSS variables) instead of a UI kit: smaller bundle, and every style is easy to explain.

---

## Known limitations

- **No authentication or multi-user support.** The board is one shared list. Anyone with the URL can edit it.
- **No real-time sync.** Two browser tabs won't see each other's changes until reload.
- **Concurrent edits are last-write-wins.** MongoDB transactions need a replica set (Atlas has one, but I kept the code portable), so the bulk reorder is one batched write rather than a transaction. A crash mid-write could in theory leave a gap in positions, which the next move heals.
- **Dragging is disabled while a filter is active**, because positions are ambiguous when some cards are hidden. Clear the filter to reorder.
- **Free-tier cold starts**: the API sleeps after ~15 minutes idle, so the first request after that is slow.
- Activity log keeps the latest 50 events and has no pagination.
- No automated browser (end-to-end) tests; the drag-and-drop interaction was tested manually, while the API and reorder logic have automated tests.

---

## Deployment

### 1. Database: MongoDB Atlas
1. Create a free **M0** cluster at https://cloud.mongodb.com.
2. *Database Access* → add a user with a password.
3. *Network Access* → allow `0.0.0.0/0` (Render's free tier has no fixed IP).
4. *Connect → Drivers* → copy the connection string and put your password in it, e.g. `mongodb+srv://user:password@cluster0.xxxx.mongodb.net/taskboard?retryWrites=true&w=majority`.

### 2. API: Render
1. *New → Web Service* → connect this repo (or *New → Blueprint* to use `render.yaml`).
2. Settings if doing it by hand: **Root directory** `server` · **Build** `npm install --omit=dev` · **Start** `npm start` · **Health check path** `/api/health`.
3. Environment variables: `NODE_ENV=production`, `MONGODB_URI=<your Atlas string>`, `CLIENT_ORIGIN=<your Vercel URL, no trailing slash>` (you can add this after step 3 and redeploy).
4. Check `https://<your-service>.onrender.com/api/health` returns `{"status":"ok"}`.

### 3. Frontend: Vercel
1. *Add New → Project* → import this repo.
2. **Root directory** `client` · Framework preset **Vite** (build `npm run build`, output `dist`).
3. Environment variable: `VITE_API_URL=https://<your-service>.onrender.com` (no trailing slash).
4. Deploy, then put the Vercel URL into `CLIENT_ORIGIN` on Render so CORS allows it.
