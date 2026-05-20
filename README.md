# TaskFlow Pro - Project Management & Team Collaboration App

Full-stack task management with realtime chat, calendar, analytics, video meetings, and Pomodoro focus tracking.

## Features

### Core
- JWT authentication (signup, login, logout)
- Role-based access (`ADMIN` / `MEMBER`)
- Projects, tasks, Kanban board, notifications
- Dark/light theme

### Advanced
- **Team Chat** — Project chat rooms, Socket.io realtime, typing indicators, online presence, unread badges, emoji picker, PostgreSQL history
- **Calendar** — FullCalendar month/week views, drag-to-reschedule, filters, priority colors, task detail modal
- **Analytics** — Recharts dashboards: completion rate, weekly graph, team productivity, project progress, priority distribution (live socket refresh)
- **Video Meetings** — Jitsi embed, per-project rooms, meeting history, shareable links
- **Pomodoro** — 25/5 timer widget, session persistence, daily focus stats, completion sound

## Tech Stack

| Layer | Stack |
|-------|--------|
| Frontend | React (Vite), Tailwind CSS v4, React Router, Context API, Socket.io-client, Recharts, FullCalendar, emoji-picker-react |
| Backend | Node.js, Express, Prisma, PostgreSQL, JWT, Socket.io |
| Meetings | Jitsi Meet (`meet.jit.si` or self-hosted) |

## Folder Structure

```txt
taskpro/
  backend/
    config/          db.js, socket.js, socketHandlers.js
    controllers/     auth, project, task, chat, analytics, meeting, focus
    routes/
    utils/           projectAccess.js, generateToken.js
    prisma/          schema.prisma, migrations/
    server.js
  frontend/
    src/
      components/
        chat/        MessageBubble, TypingIndicator
        calendar/    TaskDetailModal
        meeting/     JitsiEmbed
        pomodoro/    PomodoroWidget
        ui/          Skeleton
      context/       Auth, Theme, Pomodoro
      pages/         Chat, Calendar, Analytics, Meetings, ...
      services/      api.js, socket.js
      utils/         taskStyles.js
```

## Installation

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev

# Frontend
cd ../frontend
npm install
```

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/taskflow_pro?schema=public"
JWT_SECRET=your_super_secure_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
JITSI_DOMAIN=meet.jit.si
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_JITSI_DOMAIN=meet.jit.si
```

## Run Locally

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Open `http://localhost:5173`

## API Routes

### Chat
- `GET /api/chat/rooms` — Project rooms + unread counts
- `GET /api/chat/:projectId/messages` — Message history (marks read)
- `PUT /api/chat/:projectId/read` — Mark room read

### Tasks (calendar)
- `GET /api/tasks/calendar?start=&end=&projectId=&status=&assignedTo=`

### Analytics
- `GET /api/analytics/advanced` — Full productivity dashboard data

### Meetings
- `GET /api/meetings/project/:projectId`
- `POST /api/meetings` — `{ projectId, title? }`
- `PUT /api/meetings/:id/end`

### Focus (Pomodoro)
- `GET /api/focus/stats`
- `GET /api/focus/history`
- `POST /api/focus/sessions` — `{ taskId?, type: WORK|BREAK, durationMinutes }`

### Socket.io events (JWT in `auth.token`)
- `chat:join` / `chat:leave` / `chat:send` / `chat:typing`
- `chat:message` / `chat:typing` / `presence:update` / `presence:list`
- `join:project` / `task:created` / `task:updated` / `notification:new`

## Database Models (Prisma)

- `ChatRoom`, `Message`, `ChatReadState`
- `Meeting`
- `FocusSession`

Migration: `20260520170043_advanced_features`

## Deployment Notes

1. Run `npx prisma migrate deploy` on production DB.
2. Set `CLIENT_URL` to your frontend origin (CORS + Socket.io).
3. Frontend: set `VITE_API_BASE_URL`, `VITE_SOCKET_URL` (same host as API, no `/api` suffix).
4. Jitsi: use public `meet.jit.si` or self-host and set `JITSI_DOMAIN` / `VITE_JITSI_DOMAIN`.
5. Enable WebSocket support on your host (Railway/Render support this).
6. Helmet may need CSP tweaks if Jitsi iframe is blocked in production.

## New Frontend Routes

| Path | Page |
|------|------|
| `/chat` | Team chat |
| `/calendar` | Task calendar |
| `/analytics` | Advanced analytics |
| `/meetings` | Video meetings |

Pomodoro timer: floating widget on all authenticated pages.
