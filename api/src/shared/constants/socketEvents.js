const SOCKET_EVENTS = Object.freeze({
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  ROOM_PARTICIPANTS: "room:participants",
  PRESENCE_TYPING_START: "presence:typing:start",
  PRESENCE_TYPING_STOP: "presence:typing:stop",
  DOCUMENT_PATCH: "document:patch",
  DOCUMENT_PATCH_APPLIED: "document:patch:applied",
  DOCUMENT_SYNC_ERROR: "document:sync:error",
});

export { SOCKET_EVENTS };
