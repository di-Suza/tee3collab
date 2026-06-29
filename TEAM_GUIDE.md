# CodeRoom Team Guide

This guide keeps the 24-hour sprint fast without making the repo messy.

## Development Flow

1. Pull latest before starting a task.
2. Work inside your domain folder as much as possible.
3. Commit logical chunks, not one giant final commit.
4. Use clear commit messages like `Add room join validation` or `Implement delta patch transform`.
5. Before pushing, run the relevant app locally.

## Ownership Map

Fill this immediately after the team split:

```txt
Domain A - Auth and Room Management:
Domain B - Document and Sync Engine:
Domain C - Realtime and Presence:
MongoDB Persistence:
```

## Folder Ownership

Domain A should mostly work in:

```txt
api/src/modules/auth
api/src/modules/rooms
api/src/shared/utils/googleAuth.js
api/src/shared/utils/jwtToken.js
api/src/shared/utils/passwordHash.js
api/src/shared/utils/roomCode.js
web/src/features/auth
web/src/features/rooms
```

Domain B should mostly work in:

```txt
api/src/modules/documents
api/src/shared/utils/patch.js
api/src/sockets/handlers/documentSocket.js
web/src/features/editor
```

Domain C should mostly work in:

```txt
api/src/modules/presence
api/src/sockets/handlers/roomSocket.js
web/src/features/editor
```

Shared areas need coordination:

```txt
api/src/app.js
api/src/server.js
api/src/config
api/src/shared
api/src/sockets/socketGateway.js
web/src/app
web/src/shared
```

## Backend Layer Rule

Follow this request flow:

```txt
route -> validator -> controller -> service -> repository -> model
```

- Routes map URLs and middleware.
- Validators define request shape.
- Controllers handle HTTP request/response.
- Services contain business rules.
- Repositories talk to MongoDB.
- Models define MongoDB schema.

## Error Rule

Use custom error classes from `api/src/shared/errors`.

Examples:

```js
throw new NotFoundError("Room not found");
throw new UnauthorizedError("Login is required");
throw new ForbiddenError("Only the host can close this room");
```

Do not return raw errors from services. Throw an error class and let `ErrorHandlerMiddleware` format it.

## Socket Event Rule

Use names from `api/src/shared/constants/socketEvents.js`.

Current event groups:

```txt
room:join
room:leave
room:participants
presence:typing:start
presence:typing:stop
document:patch
document:patch:applied
document:sync:error
```

## Domain B Planning Notes

When Domain B starts, decide and document:

- Why the client sends patches instead of the whole document.
- What patch shape the client/server use.
- Why the server is authoritative.
- How conflicting or stale patches are handled.
- What happens when two users type at the same position.
- What data can be lost, if any, and why that tradeoff is acceptable for this sprint.

## Deployment Checklist

- Backend deployed with `MONGO_URI`, `JWT_ACCESS_SECRET`, Google env vars, and CORS origins.
- Frontend deployed with `VITE_API_URL` and `VITE_SOCKET_URL`.
- MongoDB Atlas or another hosted MongoDB is connected.
- Socket.io works on the deployed URL, not only localhost.
- Room content survives backend restart.
- Video demo uses deployed frontend link.

## Do Not Build Yet

These are out of scope for bar tier:

- CRDT/OT libraries
- Syntax highlighting
- Autocomplete
- Code execution
- OAuth providers other than Google
- Multi-file editor, unless bar tier is complete
