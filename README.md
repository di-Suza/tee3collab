# CodeRoom

CodeRoom is a real-time collaborative code editor for the Kodex Mini Hack-Sprint. This repo is an initial monorepo scaffold only.

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

- Frontend: React, Vite, Tailwind CSS, React Router, Axios, Socket.io client
- Backend: Node.js, Express, MongoDB/Mongoose, Redis, Socket.io
- Auth: Google auth only
- Architecture: class-based backend with route, controller, service, repository, model, validator, DTO, and interface starter files

## Sprint Domains

- Domain A: Auth and room management
- Domain B: Document and sync engine
- Domain C: Realtime and presence
- Cross-cutting: MongoDB persistence

Fill owners after team split:

```txt
Domain A owner:
Domain B owner:
Domain C owner:
MongoDB persistence owner:
```

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

## Current Scope

This scaffold intentionally does not implement Domain A, Domain B, or Domain C business flows. Module files contain starter classes and comments only, so each owner can build their own part cleanly.

Domain B should define the actual document sync strategy inside `api/src/modules/documents` and `api/src/shared/utils/patch.js`.

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

## Rules Reminder

- Do not use CRDT/OT libraries like Yjs, ShareDB, or Automerge.
- Do not build syntax highlighting, autocomplete, linting, or code execution for the bar tier.
- Deploy frontend, backend, sockets, and MongoDB persistence before submission.
- Keep commit messages clear and tied to domain ownership.
