# CodeRoom

CodeRoom is a MERN + Socket.io collaborative code editor for the Kodex Mini Hack-Sprint. Users authenticate, create or join a room, and edit one shared document in near real time with MongoDB persistence.

## Monorepo Layout

```txt
.
|-- api/   # Express, MongoDB, Redis, Socket.io backend
|-- web/   # React Vite frontend
|-- package.json
|-- .gitignore
`-- TEAM_GUIDE.md
```

## Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Redux Toolkit, Axios, Monaco Editor, Socket.io client
- Backend: Node.js, Express, MongoDB/Mongoose, Redis, Socket.io
- Auth: Google auth with HTTP-only auth cookies
- Architecture: class-based route, controller, service, repository, model, validator, DTO, and interface layers

## Sprint Domains

```txt
Domain A - Auth and Room Management: add owner name
Domain B - Document and Sync Engine: Sujal
Domain C - Realtime and Presence: add owner name
MongoDB Persistence: add owner name
Live deployed link: add link before submission
```

## Implemented Flow

- Google sign-in redirects authenticated users to the dashboard.
- Dashboard supports create room, join room by code/password, invite-link join, room history, host close-room control, and profile editing.
- Room creation generates a six-character shareable room code and stores a hashed room password.
- The editor loads the saved document snapshot and sends position-based patches through Socket.io.
- Document content, version, last editor, and patch history persist in MongoDB.
- Document HTTP and socket sync are guarded by room membership.

## Domain B Sync Strategy

The client does not send the full document on every edit. Monaco changes are converted into a compact patch: `baseVersion`, `position`, `deleteCount`, and `insertText`. The server is authoritative and stores a monotonically increasing document version plus recent patch history. If a client sends a stale patch, the server shifts its position across accepted patches after that client's `baseVersion`, applies the transformed patch, and returns a visible conflict reason. This keeps concurrent inserts from overwriting each other without using banned CRDT/OT libraries like Yjs, ShareDB, or Automerge.

## Backend Structure

```txt
api/src
|-- app.js
|-- server.js
|-- config/
|-- modules/
|   |-- auth/
|   |-- rooms/
|   |-- documents/
|   `-- presence/
|-- shared/
|   |-- constants/
|   |-- errors/
|   |-- middleware/
|   |-- utils/
|   `-- validators/
`-- sockets/
```

Each module follows this shape:

```txt
module/
|-- module.route.js
|-- module.controller.js
|-- module.service.js
|-- module.repository.js
|-- module.model.js
|-- module.validator.js
|-- module.dto.js
`-- module.interface.js
```

## Key API Routes

- `GET /api/v1/auth/me`
- `PATCH /api/v1/auth/me`
- `POST /api/v1/rooms/create`
- `POST /api/v1/rooms/join`
- `POST /api/v1/rooms/join-link`
- `GET /api/v1/rooms/history`
- `PATCH /api/v1/rooms/:roomCode/close`
- `GET /api/v1/documents/:roomCode`
- `PATCH /api/v1/documents/:roomCode/patch`

## Socket Events

- `document:join`
- `document:snapshot`
- `document:patch`
- `document:patch:applied`
- `document:sync:error`
- `presence:typing:start`
- `presence:typing:stop`
- `document:typing`

## Setup

Install dependencies:

```bash
npm run install:all
```

Create environment files:

```bash
cp api/.env.example api/.env
cp web/.env.example web/.env
```

Run both apps from the root:

```bash
npm run dev
```

Run individually:

```bash
npm run dev:api
npm run dev:web
```

## Scripts

- `npm run dev` - run API and web together
- `npm run dev:api` - run only backend
- `npm run dev:web` - run only frontend
- `npm run build` - build frontend
- `npm run start` - start backend
- `npm run lint` - lint frontend

## Verification

```bash
npm --prefix web run build
Get-ChildItem -Recurse -File api/src -Filter *.js | ForEach-Object { node --check $_.FullName }
git diff --check
```

## Rules Reminder

- Do not use CRDT/OT libraries like Yjs, ShareDB, or Automerge.
- Do not send full-document payloads for per-keystroke sync.
- Do not add code execution.
- Deploy frontend, backend, sockets, and MongoDB persistence before submission.
- Keep commit messages clear and tied to domain ownership.
