import Editor from "@monaco-editor/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { DocumentService } from "../services/document.service.js";
import { EditorSocketService } from "../services/editor-socket.service.js";
import RoomService from "../../rooms/services/room.service.js";
import { clearCurrentRoom, setCurrentRoom } from "../../rooms/roomsSlice.js";
import {
  applyPatchToText,
  createClientId,
  createPatchFromChange,
} from "../utils/text-patch.js";
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  Copy,
  DoorOpen,
  Globe,
  Pencil,
  Save,
  Shield,
  Trash2,
  UserMinus,
  Users,
  Zap,
} from "lucide-react";

const LANGUAGE_OPTIONS = [
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "JSON", value: "json" },
  { label: "Python", value: "python" },
  { label: "Plain Text", value: "plaintext" },
];

const USER_COLOR_CLASSES = [
  "coderoom-user-0",
  "coderoom-user-1",
  "coderoom-user-2",
  "coderoom-user-3",
  "coderoom-user-4",
];

function lineFromOffset(content = "", offset = 0) {
  return content.slice(0, Math.max(0, offset)).split("\n").length;
}

function hashColorIndex(value = "") {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % USER_COLOR_CLASSES.length;
  }

  return hash;
}

function actorName(actor = {}) {
  return actor.isSelf ? "You" : actor.name || "Someone";
}

function actorPresenceKey(actor = {}) {
  return String(actor.id || actor._id || actor.name || "remote");
}

function participantInitials(name = "") {
  const parts = String(name || "User").trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "U";
}

function participantName(participant = {}, currentUserId = "") {
  return String(participant.id) === String(currentUserId)
    ? "You"
    : participant.name || "Unknown user";
}

function changedLinesForPatch(content = "", patch = {}) {
  const safePosition = Math.min(Math.max(patch.position || 0, 0), content.length);
  const deleteEnd = Math.min(safePosition + (patch.deleteCount || 0), content.length);
  const deletedText = content.slice(safePosition, deleteEnd);
  const startLine = lineFromOffset(content, safePosition);
  const lineCount = Math.max(
    1,
    deletedText.split("\n").length,
    String(patch.insertText || "").split("\n").length,
  );

  return Array.from({ length: lineCount }, (_, index) => startLine + index);
}

function transformOffsetAgainstPatch(offset, patch = {}) {
  const start = patch.position || 0;
  const deleteCount = patch.deleteCount || 0;
  const insertLength = String(patch.insertText || "").length;
  const end = start + deleteCount;

  if (offset < start) {
    return offset;
  }

  if (offset <= end) {
    return start + insertLength;
  }

  return offset - deleteCount + insertLength;
}

function transformPatchAgainstPatch(patch, acceptedPatch = {}) {
  let nextPosition = patch.position || 0;
  const acceptedPosition = acceptedPatch.position || 0;
  const acceptedDeleteCount = acceptedPatch.deleteCount || 0;
  const acceptedInsertLength = String(acceptedPatch.insertText || "").length;
  const acceptedDeleteEnd = acceptedPosition + acceptedDeleteCount;

  if (acceptedDeleteCount > 0 && nextPosition > acceptedPosition) {
    if (nextPosition <= acceptedDeleteEnd) {
      nextPosition = acceptedPosition;
    } else {
      nextPosition -= acceptedDeleteCount;
    }
  }

  if (acceptedInsertLength > 0 && acceptedPosition <= nextPosition) {
    nextPosition += acceptedInsertLength;
  }

  return {
    ...patch,
    position: Math.max(0, nextPosition),
  };
}

function EditorLoadingSkeleton() {
  return (
    <div className="flex h-full w-full flex-col bg-[#1e1e1e] p-5">
      <div className="mb-5 flex items-center justify-between">
        <div className="h-3 w-36 animate-pulse rounded-full bg-zinc-700" />
        <div className="h-3 w-20 animate-pulse rounded-full bg-zinc-800" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, index) => (
          <div className="flex items-center gap-4" key={index}>
            <div className="h-3 w-5 rounded bg-zinc-800" />
            <div
              className="h-3 animate-pulse rounded bg-zinc-700/80"
              style={{ width: `${72 - (index % 4) * 12}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-xl border border-zinc-800 bg-black/30 p-4">
        <div className="h-3 w-48 animate-pulse rounded-full bg-zinc-700" />
        <div className="mt-3 h-2 w-72 animate-pulse rounded-full bg-zinc-800" />
      </div>
    </div>
  );
}

export function EditorRoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const room = useSelector((state) => state.rooms.currentRoom);
  const currentUser = useSelector((state) => state.auth.user);

  const [roomDetails, setRoomDetails] = useState(room || null);
  const currentRoom = roomDetails || room;
  const displayCode = currentRoom?.roomCode || roomCode;
  const currentUserId = String(currentUser?.id || currentUser?._id || "");
  const createdRoomInvite = location.state?.createdRoomInvite || null;

  const [content, setContent] = useState("");
  const [version, setVersion] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [presenceSummary, setPresenceSummary] = useState({ onlineCount: 0, totalCount: 0 });
  const [lastActor, setLastActor] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(true);
  const [roomEditing, setRoomEditing] = useState(false);
  const [roomName, setRoomName] = useState(room?.name || "");
  const [roomDescription, setRoomDescription] = useState(room?.description || "");
  const [roomPassword, setRoomPassword] = useState("");
  const [roomActionLoading, setRoomActionLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(Boolean(createdRoomInvite));
  const [activePanel, setActivePanel] = useState("identity");
  const [language, setLanguage] = useState("javascript");

  const currentParticipant = participants.find(
    (participant) => String(participant.id) === currentUserId,
  );
  const isHost = Boolean(currentRoom?.isHost || currentParticipant?.role === "host");

  const socketRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const clientIdRef = useRef("");
  const contentRef = useRef("");
  const syncedContentRef = useRef("");
  const versionRef = useRef(0);
  const loadingRef = useRef(true);
  const applyingRemoteRef = useRef(false);
  const sendingPatchRef = useRef(false);
  const flushQueuedRef = useRef(false);
  const localRoomDeleteRef = useRef(false);
  const typingTimerRef = useRef(null);
  const remoteTypingTimersRef = useRef(new Map());
  const conflictClearTimerRef = useRef(null);
  const decorationIdsRef = useRef([]);
  const lineAuthorsRef = useRef(new Map());
  const typingIndicatorsRef = useRef(new Map());
  const participantActivityRef = useRef(new Map());
  const participantsRef = useRef([]);
  const conflictMarkersRef = useRef(new Map());

  const decorateParticipants = useCallback((nextParticipants = []) => {
    return nextParticipants.map((participant) => {
      const activity = participantActivityRef.current.get(actorPresenceKey(participant));

      return {
        ...participant,
        isTyping: Boolean(activity),
        typingLine: activity?.lineNumber || null,
      };
    });
  }, []);

  const refreshParticipantActivity = useCallback(() => {
    setParticipants(decorateParticipants(participantsRef.current));
  }, [decorateParticipants]);

  const applyParticipantsPayload = useCallback(
    (payload = {}) => {
      const nextParticipants = Array.isArray(payload.participants)
        ? payload.participants
        : [];

      participantsRef.current = nextParticipants;
      setPresenceSummary({
        onlineCount: payload.onlineCount ?? nextParticipants.filter(
          (participant) => participant.status === "online",
        ).length,
        totalCount: payload.totalCount ?? nextParticipants.length,
      });
      setParticipants(decorateParticipants(nextParticipants));
    },
    [decorateParticipants],
  );

  const loadRoomDetails = useCallback(async () => {
    try {
      const result = await RoomService.getRoom(displayCode);
      setRoomDetails(result.room);
      setRoomName(result.room?.name || "");
      setRoomDescription(result.room?.description || "");
      dispatch(setCurrentRoom(result.room));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to load room details");
    }
  }, [dispatch, displayCode]);

  useEffect(() => {
    if (room?.roomCode === displayCode) {
      setRoomDetails(room);
      setRoomName(room.name || "");
      setRoomDescription(room.description || "");
    }
  }, [displayCode, room]);

  useEffect(() => {
    loadRoomDetails();
  }, [loadRoomDetails]);

  const refreshEditorDecorations = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    if (!editor || !monaco) {
      return;
    }

    const decorations = [];
    const model = editor.getModel();
    const lineCount = model?.getLineCount() || 1;

    for (const [lineNumber, actor] of lineAuthorsRef.current.entries()) {
      const safeLine = Math.min(Math.max(Number(lineNumber), 1), lineCount);
      const colorIndex = hashColorIndex(actor?.id || actor?.name || "");
      const maxColumn = model.getLineMaxColumn(safeLine);
      const label = actorName(actor);

      decorations.push({
        range: new monaco.Range(safeLine, 1, safeLine, 1),
        options: {
          isWholeLine: true,
          className: `coderoom-line-author ${USER_COLOR_CLASSES[colorIndex]}`,
          hoverMessage: { value: `Last edited by ${label}` },
        },
      });

      decorations.push({
        range: new monaco.Range(safeLine, maxColumn, safeLine, maxColumn),
        options: {
          after: {
            content: `  ${label}`,
            inlineClassName: `coderoom-author-label coderoom-user-text-${colorIndex}`,
          },
        },
      });
    }

    for (const indicator of typingIndicatorsRef.current.values()) {
      const safeLine = Math.min(Math.max(Number(indicator.lineNumber || 1), 1), lineCount);
      const colorIndex = hashColorIndex(indicator.actor?.id || indicator.actor?.name || "");
      const maxColumn = model.getLineMaxColumn(safeLine);

      decorations.push({
        range: new monaco.Range(safeLine, 1, safeLine, 1),
        options: {
          isWholeLine: true,
          className: `coderoom-typing-line ${USER_COLOR_CLASSES[colorIndex]}`,
        },
      });

      decorations.push({
        range: new monaco.Range(safeLine, maxColumn, safeLine, maxColumn),
        options: {
          after: {
            content: `  ${actorName(indicator.actor)} typing`,
            inlineClassName: `coderoom-typing-label coderoom-user-text-${colorIndex}`,
          },
        },
      });
    }

    for (const marker of conflictMarkersRef.current.values()) {
      const safeLine = Math.min(Math.max(Number(marker.lineNumber || 1), 1), lineCount);

      decorations.push({
        range: new monaco.Range(safeLine, 1, safeLine, 1),
        options: {
          glyphMarginClassName: "coderoom-conflict-glyph",
          glyphMarginHoverMessage: { value: marker.message },
          hoverMessage: { value: marker.message },
        },
      });
    }

    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, decorations);
  }, []);

  const applyDocumentMetadata = useCallback(
    (metadata = {}) => {
      lineAuthorsRef.current = new Map(
        (metadata.lineAuthors || []).map((entry) => [
          Number(entry.lineNumber),
          {
            ...(entry.actor || {}),
            isSelf: String(entry.actor?.id || "") === currentUserId,
          },
        ]),
      );

      conflictMarkersRef.current = new Map(
        (metadata.conflictMarkers || []).map((marker) => [
          Number(marker.lineNumber),
          {
            lineNumber: Number(marker.lineNumber),
            message: marker.message || marker.reason || "Conflict resolved near this line.",
          },
        ]),
      );

      refreshEditorDecorations();
    },
    [currentUserId, refreshEditorDecorations],
  );

  const recordLineAuthor = useCallback((baseContent, patch, actor) => {
    for (const lineNumber of changedLinesForPatch(baseContent, patch)) {
      lineAuthorsRef.current.set(lineNumber, actor);
    }
  }, []);

  const showConflictMarker = useCallback((lineNumber, conflictPayload, actor) => {
    if (!conflictPayload) {
      return;
    }

    const safeLine = Math.max(Number(lineNumber || 1), 1);
    const message = `${actorName(actor)} edit was rebased here. ${conflictPayload.reason}`;

    conflictMarkersRef.current.set(safeLine, {
      lineNumber: safeLine,
      message,
    });

    setConflict({
      ...conflictPayload,
      reason: message,
    });

    window.clearTimeout(conflictClearTimerRef.current);
    conflictClearTimerRef.current = window.setTimeout(() => {
      setConflict(null);
    }, 3500);
  }, []);

  const replaceEditorContent = useCallback((nextContent, cursorPatch = null) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();

    if (!editor || !monaco || !model) {
      contentRef.current = nextContent;
      return;
    }

    if (model.getValue() === nextContent) {
      contentRef.current = nextContent;
      return;
    }

    const focused = editor.hasTextFocus();
    const position = editor.getPosition();
    const cursorOffset = position ? model.getOffsetAt(position) : null;
    const fullRange = model.getFullModelRange();

    editor.executeEdits("remote-rebase", [
      {
        range: fullRange,
        text: nextContent,
        forceMoveMarkers: true,
      },
    ]);

    if (focused && cursorOffset !== null) {
      const nextOffset = cursorPatch
        ? transformOffsetAgainstPatch(cursorOffset, cursorPatch)
        : cursorOffset;
      const safeOffset = Math.min(Math.max(nextOffset, 0), model.getValueLength());

      editor.setPosition(model.getPositionAt(safeOffset));
    }

    contentRef.current = model.getValue();
  }, []);

  const applyPatchToEditor = useCallback((patch) => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();

    if (!editor || !monaco || !model) {
      contentRef.current = applyPatchToText(contentRef.current, patch);
      return;
    }

    const safePosition = Math.min(Math.max(patch.position, 0), model.getValueLength());
    const deleteEnd = Math.min(safePosition + patch.deleteCount, model.getValueLength());
    const start = model.getPositionAt(safePosition);
    const end = model.getPositionAt(deleteEnd);
    const focused = editor.hasTextFocus();
    const cursorPosition = editor.getPosition();
    const cursorOffset = cursorPosition ? model.getOffsetAt(cursorPosition) : null;

    editor.executeEdits("remote-sync", [
      {
        range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
        text: patch.insertText,
        forceMoveMarkers: true,
      },
    ]);

    if (focused && cursorOffset !== null) {
      const safeOffset = Math.min(
        Math.max(transformOffsetAgainstPatch(cursorOffset, patch), 0),
        model.getValueLength(),
      );

      editor.setPosition(model.getPositionAt(safeOffset));
    }

    contentRef.current = model.getValue();
  }, []);

  const applySnapshotToEditor = useCallback((snapshotContent) => {
    const editor = editorRef.current;
    const model = editor?.getModel();

    if (!editor || !model || model.getValue() === snapshotContent) {
      return;
    }

    const focused = editor.hasTextFocus();
    const position = editor.getPosition();
    const cursorOffset = position ? model.getOffsetAt(position) : null;

    editor.setValue(snapshotContent);

    if (focused && cursorOffset !== null) {
      const safeOffset = Math.min(Math.max(cursorOffset, 0), model.getValueLength());
      editor.setPosition(model.getPositionAt(safeOffset));
    }
  }, []);

  const handleEditorMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    if (contentRef.current) {
      editor.setValue(contentRef.current);
    }

    monaco.editor.setModelLanguage(editor.getModel(), language);
    refreshEditorDecorations();
  }, [language, refreshEditorDecorations]);

  const applySnapshot = useCallback((snapshot) => {
    applyingRemoteRef.current = true;
    contentRef.current = snapshot.content || "";
    syncedContentRef.current = snapshot.content || "";
    versionRef.current = snapshot.version || 0;
    loadingRef.current = false;
    setDocumentLoading(false);
    setContent(snapshot.content || "");
    setVersion(snapshot.version || 0);
    applySnapshotToEditor(snapshot.content || "");
    applyDocumentMetadata(snapshot.metadata);
    window.setTimeout(() => {
      applyingRemoteRef.current = false;
    }, 0);
  }, [applyDocumentMetadata, applySnapshotToEditor]);

  const reloadSnapshot = useCallback(async () => {
    const snapshot = await DocumentService.getDocument(displayCode);
    applySnapshot(snapshot);
  }, [applySnapshot, displayCode]);

  const getCurrentEditorValue = useCallback(() => {
    return editorRef.current?.getModel()?.getValue() ?? contentRef.current;
  }, []);

  const handleOwnPatchAccepted = useCallback(
    (payload, submittedPatch) => {
      const acceptedPatch = payload?.patch || submittedPatch;
      const previousServerContent = syncedContentRef.current;
      const nextServerContent = payload?.content || applyPatchToText(previousServerContent, acceptedPatch);
      const actor = {
        ...(payload?.actor || {}),
        id: clientIdRef.current,
        name: "You",
        isSelf: true,
      };

      versionRef.current = payload?.version ?? versionRef.current;
      syncedContentRef.current = nextServerContent;
      contentRef.current = getCurrentEditorValue();

      setVersion(versionRef.current);
      setLastActor("You");
      setConflict(null);
      window.clearTimeout(conflictClearTimerRef.current);
      if (payload?.metadata) {
        applyDocumentMetadata(payload.metadata);
      } else {
        recordLineAuthor(previousServerContent, acceptedPatch, actor);
      }
      refreshEditorDecorations();
    },
    [applyDocumentMetadata, getCurrentEditorValue, recordLineAuthor, refreshEditorDecorations],
  );

  const flushLocalChanges = useCallback(() => {
    if (loadingRef.current || applyingRemoteRef.current) {
      flushQueuedRef.current = true;
      return;
    }

    if (sendingPatchRef.current) {
      flushQueuedRef.current = true;
      return;
    }

    const socketService = socketRef.current;
    const currentText = getCurrentEditorValue();
    contentRef.current = currentText;

    if (!socketService || currentText === syncedContentRef.current) {
      flushQueuedRef.current = false;
      return;
    }

    const patch = createPatchFromChange(
      syncedContentRef.current,
      currentText,
      versionRef.current,
      clientIdRef.current,
    );

    if (!patch) {
      flushQueuedRef.current = false;
      return;
    }

    sendingPatchRef.current = true;
    flushQueuedRef.current = false;

    socketService.sendPatch(displayCode, patch, (ack) => {
      sendingPatchRef.current = false;

      if (!ack?.ok) {
        setError(ack?.error?.message || "Patch was rejected by the server");
        reloadSnapshot();
        return;
      }

      handleOwnPatchAccepted(ack.data, patch);

      window.requestAnimationFrame(() => {
        const latestText = getCurrentEditorValue();

        if (flushQueuedRef.current || latestText !== syncedContentRef.current) {
          flushLocalChanges();
        }
      });
    });
  }, [displayCode, getCurrentEditorValue, handleOwnPatchAccepted, reloadSnapshot]);

  const handleRemotePatchApplied = useCallback(
    (payload) => {
      const patch = payload.patch;

      if (patch.clientId === clientIdRef.current) {
        handleOwnPatchAccepted(payload, patch);
        return;
      }

      const actor = payload.actor || { name: "Someone" };
      const previousServerContent = syncedContentRef.current;
      const previousVersion = versionRef.current;
      const currentText = getCurrentEditorValue();
      const hasLocalChanges = currentText !== previousServerContent;
      const nextServerContent = payload.content || applyPatchToText(previousServerContent, patch);
      const editedLine = lineFromOffset(previousServerContent, patch.position);

      versionRef.current = payload.version;
      syncedContentRef.current = nextServerContent;
      setVersion(payload.version);
      setLastActor(actor.name || "Someone");
      if (payload.metadata) {
        applyDocumentMetadata(payload.metadata);
      } else {
        recordLineAuthor(previousServerContent, patch, actor);
      }

      if (payload.conflict) {
        showConflictMarker(editedLine, payload.conflict, actor);
      }

      applyingRemoteRef.current = true;

      if (hasLocalChanges) {
        const localPatch = createPatchFromChange(
          previousServerContent,
          currentText,
          previousVersion,
          clientIdRef.current,
        );
        const rebasedLocalPatch = localPatch ? transformPatchAgainstPatch(localPatch, patch) : null;
        const mergedText = rebasedLocalPatch
          ? applyPatchToText(nextServerContent, rebasedLocalPatch)
          : nextServerContent;

        replaceEditorContent(mergedText, patch);
        flushQueuedRef.current = true;
      } else {
        applyPatchToEditor(patch);
      }

      refreshEditorDecorations();
      window.setTimeout(() => {
        applyingRemoteRef.current = false;

        if (flushQueuedRef.current && !sendingPatchRef.current) {
          flushLocalChanges();
        }
      }, 0);
    },
    [
      applyPatchToEditor,
      applyDocumentMetadata,
      flushLocalChanges,
      getCurrentEditorValue,
      handleOwnPatchAccepted,
      recordLineAuthor,
      refreshEditorDecorations,
      replaceEditorContent,
      showConflictMarker,
    ],
  );

  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();

    if (editor && monaco && model) {
      monaco.editor.setModelLanguage(model, language);
    }
  }, [language]);

  useEffect(() => {
    clientIdRef.current = createClientId();
    let mounted = true;
    const socketService = new EditorSocketService();
    socketRef.current = socketService;
    const joinRealtimeRoom = () => {
      socketService.joinRoom(displayCode, (ack) => {
        if (!mounted) return;
        if (!ack?.ok) {
          setError(ack?.error?.message || "Unable to join room presence");
          return;
        }

        applyParticipantsPayload(ack.data);
      });

      socketService.joinDocument(displayCode, (ack) => {
        if (mounted && ack && !ack.ok) {
          setError(ack.error?.message || "Unable to join document sync");
        }
      });
    };

    DocumentService.getDocument(displayCode)
      .then((snapshot) => {
        if (mounted) applySnapshot(snapshot);
      })
      .catch((err) => {
        if (mounted) {
          setError(err.response?.data?.message || err.message || "Unable to load document");
          loadingRef.current = false;
          setDocumentLoading(false);
        }
      });

    socketService.onConnectionChange((isConnected) => {
      if (!mounted) return;
      setConnected(isConnected);

      if (isConnected) {
        joinRealtimeRoom();
      }
    });
    socketService.onSnapshot((snapshot) => {
      if (mounted) applySnapshot(snapshot);
    });

    socketService.onPatchApplied((payload) => {
      if (!mounted) return;
      handleRemotePatchApplied(payload);
    });

    socketService.onParticipants((payload) => {
      if (!mounted) return;
      applyParticipantsPayload(payload);
    });

    socketService.onRoomDeleted((payload = {}) => {
      if (!mounted) return;
      if (localRoomDeleteRef.current) return;

      window.alert(payload.message || "Room deleted");
      dispatch(clearCurrentRoom());
      navigate("/app", { replace: true });
    });

    socketService.onTyping((payload) => {
      if (!mounted) return;
      const actor = payload.actor || { name: "Someone" };
      const actorKey = actorPresenceKey(actor);

      if (payload.isTyping) {
        setTypingUser(actor.name || "Someone");
        participantActivityRef.current.set(actorKey, { lineNumber: payload.lineNumber || 1 });
        typingIndicatorsRef.current.set(actorKey, {
          actor,
          lineNumber: payload.lineNumber || 1,
        });
        refreshEditorDecorations();
        refreshParticipantActivity();

        window.clearTimeout(remoteTypingTimersRef.current.get(actorKey));
        remoteTypingTimersRef.current.set(actorKey, window.setTimeout(() => {
          participantActivityRef.current.delete(actorKey);
          typingIndicatorsRef.current.delete(actorKey);
          remoteTypingTimersRef.current.delete(actorKey);
          refreshEditorDecorations();
          refreshParticipantActivity();
          setTypingUser(null);
        }, 1800));
      } else {
        window.clearTimeout(remoteTypingTimersRef.current.get(actorKey));
        remoteTypingTimersRef.current.delete(actorKey);
        participantActivityRef.current.delete(actorKey);
        typingIndicatorsRef.current.delete(actorKey);
        refreshEditorDecorations();
        refreshParticipantActivity();
        setTypingUser(null);
      }
    });

    socketService.onRoomError((payload) => {
      if (mounted) setError(payload.message || "Room presence failed");
    });

    socketService.onSyncError((payload) => {
      if (mounted) setError(payload.message || "Document sync failed");
    });

    if (socketService.isConnected()) {
      joinRealtimeRoom();
    }

    const remoteTypingTimers = remoteTypingTimersRef.current;

    return () => {
      mounted = false;
      window.clearTimeout(typingTimerRef.current);
      for (const timerId of remoteTypingTimers.values()) {
        window.clearTimeout(timerId);
      }
      remoteTypingTimers.clear();
      window.clearTimeout(conflictClearTimerRef.current);
      socketService.leaveRoom(displayCode);
      socketService.disconnect();
    };
  }, [
    applyParticipantsPayload,
    applySnapshot,
    displayCode,
    dispatch,
    handleRemotePatchApplied,
    navigate,
    refreshEditorDecorations,
    refreshParticipantActivity,
  ]);

  const handleEditorChange = useCallback(
    (nextValue = "") => {
      if (applyingRemoteRef.current || loadingRef.current) return;
      const previousContent = contentRef.current;
      const nextContent = nextValue || "";
      const localPatch = createPatchFromChange(
        previousContent,
        nextContent,
        versionRef.current,
        clientIdRef.current,
      );
      contentRef.current = nextContent;
      if (!localPatch) return;

      setError("");
      setConflict(null);
      recordLineAuthor(previousContent, localPatch, {
        id: clientIdRef.current,
        name: "You",
        isSelf: true,
      });
      refreshEditorDecorations();

      const cursorLine = editorRef.current?.getPosition()?.lineNumber || lineFromOffset(nextContent, localPatch.position);
      if (currentUserId) {
        participantActivityRef.current.set(currentUserId, { lineNumber: cursorLine });
        refreshParticipantActivity();
      }
      socketRef.current?.startTyping(displayCode, { lineNumber: cursorLine });
      flushLocalChanges();
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = window.setTimeout(() => {
        if (currentUserId) {
          participantActivityRef.current.delete(currentUserId);
          refreshParticipantActivity();
        }
        socketRef.current?.stopTyping(displayCode);
      }, 800);
    },
    [
      currentUserId,
      displayCode,
      flushLocalChanges,
      recordLineAuthor,
      refreshEditorDecorations,
      refreshParticipantActivity,
    ],
  );

  const copyToClipboard = useCallback(async (value) => {
    if (!navigator.clipboard || !value) {
      return;
    }

    await navigator.clipboard.writeText(value);
  }, []);

  const handleRoomUpdate = useCallback(async () => {
    try {
      setRoomActionLoading(true);
      const payload = {
        name: roomName,
        description: roomDescription,
      };

      if (roomPassword) {
        payload.password = roomPassword;
      }

      const result = await RoomService.updateRoom(displayCode, payload);
      setRoomDetails(result.room);
      dispatch(setCurrentRoom(result.room));
      setRoomPassword("");
      setRoomEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update room");
    } finally {
      setRoomActionLoading(false);
    }
  }, [dispatch, displayCode, roomDescription, roomName, roomPassword]);

  const handleDeleteRoom = useCallback(async () => {
    if (!window.confirm(`Delete room ${displayCode}? This removes it for everyone.`)) return;

    try {
      localRoomDeleteRef.current = true;
      setRoomActionLoading(true);
      await RoomService.deleteRoom(displayCode);
      dispatch(clearCurrentRoom());
      navigate("/app", { replace: true });
    } catch (err) {
      localRoomDeleteRef.current = false;
      setError(err.response?.data?.message || err.message || "Failed to delete room");
    } finally {
      setRoomActionLoading(false);
    }
  }, [dispatch, displayCode, navigate]);

  const handleLeaveRoom = useCallback(async () => {
    if (!window.confirm(`Leave room ${displayCode} permanently?`)) return;

    try {
      setRoomActionLoading(true);
      await RoomService.leaveRoom(displayCode);
      dispatch(clearCurrentRoom());
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to leave room");
    } finally {
      setRoomActionLoading(false);
    }
  }, [dispatch, displayCode, navigate]);

  const handleRemoveMember = useCallback(
    async (participant) => {
      if (!participant?.id) return;
      if (!window.confirm(`Remove ${participant.name || "this user"} from ${displayCode}?`)) return;

      try {
        setRoomActionLoading(true);
        const result = await RoomService.removeMember(displayCode, participant.id);
        setRoomDetails(result.room);
        dispatch(setCurrentRoom(result.room));
        participantsRef.current = participantsRef.current.filter(
          (entry) => String(entry.id) !== String(participant.id),
        );
        setParticipants((current) =>
          current.filter((entry) => String(entry.id) !== String(participant.id)),
        );
      } catch (err) {
        setError(err.response?.data?.message || err.message || "Failed to remove member");
      } finally {
        setRoomActionLoading(false);
      }
    },
    [dispatch, displayCode],
  );

  useEffect(() => {
    if (!showInviteModal || !createdRoomInvite) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [createdRoomInvite, showInviteModal]);

  const inviteLink = createdRoomInvite?.joinLink || `${window.location.origin}/join/${displayCode}`;
  const invitePassword = createdRoomInvite?.password || "Visible only after creation";

  const renderAccordionPanel = (id, label, Icon, children) => {
    const isOpen = activePanel === id;

    return (
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md transition-all hover:border-zinc-600">
        <button
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
          onClick={() => setActivePanel(isOpen ? "" : id)}
          type="button"
        >
          <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
            <Icon size={14} />
            {label}
          </span>
          <ChevronDown
            className={`text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
            size={16}
          />
        </button>
        {isOpen ? <div className="border-t border-zinc-800 p-5">{children}</div> : null}
      </div>
    );
  };

  return (
    <div 
      className="h-screen w-full overflow-hidden text-white font-sans selection:bg-zinc-700"
      style={{
        backgroundImage: "url('https://i.pinimg.com/736x/0c/5a/99/0c5a990ae7e9489192d6f7abf916ae19.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex h-screen w-full flex-col overflow-hidden bg-black/90 backdrop-blur-md">
        {showInviteModal && createdRoomInvite ? (
          createPortal(
          <div className="fixed left-0 top-0 z-[9999] flex h-screen w-screen items-center justify-center overflow-hidden bg-black/80 p-4 backdrop-blur-sm">
            <div className="max-h-[calc(100dvh-48px)] w-full max-w-lg overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  Room Created
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight">Share invite details</h2>
                <p className="mt-2 text-sm text-zinc-500">
                  Copy these once and share them with teammates who need to join this room.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-zinc-600">Room ID</p>
                  <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-black p-3">
                    <span className="flex-1 font-mono text-sm">{createdRoomInvite.roomCode}</span>
                    <button
                      className="text-zinc-500 transition-colors hover:text-white"
                      onClick={() => copyToClipboard(createdRoomInvite.roomCode)}
                      type="button"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-zinc-600">Password</p>
                  <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-black p-3">
                    <span className="flex-1 font-mono text-sm">
                      {createdRoomInvite.password || "No password provided"}
                    </span>
                    {createdRoomInvite.password ? (
                      <button
                        className="text-zinc-500 transition-colors hover:text-white"
                        onClick={() => copyToClipboard(createdRoomInvite.password)}
                        type="button"
                      >
                        <Copy size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-widest text-zinc-600">Invite Link</p>
                  <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-black p-3">
                    <span className="flex-1 break-all font-mono text-xs text-zinc-300">
                      {createdRoomInvite.joinLink}
                    </span>
                    <button
                      className="text-zinc-500 transition-colors hover:text-white"
                      onClick={() => copyToClipboard(createdRoomInvite.joinLink)}
                      type="button"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <button
                className="mt-5 w-full rounded-2xl bg-white py-3 text-sm font-bold text-black transition-all hover:bg-zinc-200"
                onClick={() => setShowInviteModal(false)}
                type="button"
              >
                Continue to Editor
              </button>
            </div>
          </div>,
          document.body,
          )
        ) : null}
        
        {/* --- TOP NAV --- */}
        <nav className="flex shrink-0 items-center justify-between px-8 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/app")} 
              className="p-2 rounded-lg hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Secure Session</p>
              <h1 className="text-lg font-bold tracking-tight">{displayCode}</h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="hidden items-center gap-2 text-xs text-zinc-500 md:flex">
              Language
              <select
                className="rounded-lg border border-zinc-800 bg-black px-3 py-1.5 text-xs font-semibold text-zinc-200 outline-none transition-colors focus:border-zinc-500"
                onChange={(event) => setLanguage(event.target.value)}
                value={language}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="hidden md:flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span className={connected ? "text-emerald-400" : "text-amber-400"}>
                  {connected ? "CONNECTED" : "SYNCING"}
                </span>
              </div>
              <div className="w-px h-3 bg-zinc-700"></div>
              <span className="text-zinc-500">VER {version}</span>
            </div>
            <button 
              onClick={() => navigate("/app")}
              className="rounded-full border border-zinc-800 px-4 py-1.5 text-xs font-bold text-zinc-300 transition-all hover:bg-zinc-800"
              type="button"
            >
              Exit Room
            </button>
            <button
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all disabled:opacity-50 ${
                isHost
                  ? "border border-red-900/60 text-red-300 hover:bg-red-950"
                  : "bg-white text-black hover:bg-zinc-200"
              }`}
              disabled={roomActionLoading}
              onClick={isHost ? handleDeleteRoom : handleLeaveRoom}
              type="button"
            >
              {isHost ? "Delete Room" : "Leave Room"}
            </button>
          </div>
        </nav>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 grid-cols-1 gap-6 overflow-hidden p-6 lg:grid-cols-[minmax(0,1fr)_350px]">
          
          {/* LEFT: THE EDITOR WINDOW */}
          <div className="flex min-h-0 flex-col">
            <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 shadow-2xl backdrop-blur-md">
              
              {/* Window Controls Top Bar */}
              <div className="flex shrink-0 items-center justify-between px-4 py-3 bg-black/50 border-b border-zinc-800">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  main.js - CodeRoom Editor
                </div>
                <div className="w-12"></div> {/* Spacer for balance */}
              </div>

              {/* Notification Bar */}
              {(error || conflict || typingUser) && (
                <div className="flex shrink-0 items-center justify-between px-4 py-2 text-xs font-medium border-b border-zinc-800 bg-black/40">
                  {error && <span className="text-red-400 flex items-center gap-2">Error: {error}</span>}
                  {conflict && <span className="text-amber-400 flex items-center gap-2">Conflict: {conflict.reason}</span>}
                  {typingUser && !error && !conflict && (
                    <span className="text-sky-400 animate-pulse flex items-center gap-2">
                      <Zap size={12} /> {typingUser} is typing...
                    </span>
                  )}
                </div>
              )}

              {/* The Monaco Editor */}
              <div className="min-h-0 flex-1">
                {documentLoading ? (
                  <EditorLoadingSkeleton />
                ) : (
                  <Editor
                    height="100%"
                    defaultValue={content}
                    language={language}
                    loading={<EditorLoadingSkeleton />}
                    onChange={handleEditorChange}
                    onMount={handleEditorMount}
                    options={{
                      fontSize: 14,
                      glyphMargin: true,
                      minimap: { enabled: false },
                      quickSuggestions: true,
                      wordBasedSuggestions: "off",
                      suggestOnTriggerCharacters: true,
                      tabCompletion: "on",
                      wordWrap: "on",
                      padding: { top: 20 },
                    }}
                    theme="vs-dark"
                  />
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: INFORMATION PANEL */}
          <aside className="min-h-0 space-y-4 overflow-y-auto pr-1">
            {renderAccordionPanel("identity", "Room Identity", Globe, (
              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-800 bg-black/50 p-3">
                  <p className="text-sm font-bold text-zinc-100">
                    {currentRoom?.name || "Untitled Room"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {currentRoom?.description || "No room description yet."}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-[10px] text-zinc-600">Room Code</p>
                  <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-black p-3">
                    <span className="font-mono text-sm">{displayCode}</span>
                    <button
                      className="text-zinc-500 transition-colors hover:text-white"
                      onClick={() => copyToClipboard(displayCode)}
                      type="button"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-[10px] text-zinc-600">Password</p>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-black p-3">
                    <span className="min-w-0 truncate font-mono text-xs text-zinc-300">
                      {invitePassword}
                    </span>
                    {createdRoomInvite?.password ? (
                      <button
                        className="shrink-0 text-zinc-500 transition-colors hover:text-white"
                        onClick={() => copyToClipboard(createdRoomInvite.password)}
                        type="button"
                      >
                        <Copy size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-[10px] text-zinc-600">Quick Invite Link</p>
                  <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-black p-3">
                    <span className="min-w-0 flex-1 break-all font-mono text-xs text-zinc-300">
                      {inviteLink}
                    </span>
                    <button
                      className="shrink-0 text-zinc-500 transition-colors hover:text-white"
                      onClick={() => copyToClipboard(inviteLink)}
                      type="button"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                {isHost ? (
                  <div className="rounded-2xl border border-amber-900/40 bg-amber-950/10 p-3">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-amber-300">Host privileges</p>
                        <p className="mt-1 text-[10px] text-zinc-500">
                          Rename room, change password, or delete it for everyone.
                        </p>
                      </div>
                      <button
                        className="rounded-full border border-zinc-800 p-2 text-zinc-400 transition-colors hover:text-white"
                        onClick={() => setRoomEditing((value) => !value)}
                        type="button"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>

                    {roomEditing ? (
                      <div className="space-y-3">
                        <input
                          className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-xs outline-none focus:border-zinc-500"
                          maxLength={80}
                          onChange={(event) => setRoomName(event.target.value)}
                          placeholder="Room name"
                          value={roomName}
                        />
                        <textarea
                          className="h-20 w-full resize-none rounded-xl border border-zinc-800 bg-black px-3 py-2 text-xs outline-none focus:border-zinc-500"
                          maxLength={240}
                          onChange={(event) => setRoomDescription(event.target.value)}
                          placeholder="Room description"
                          value={roomDescription}
                        />
                        <input
                          className="w-full rounded-xl border border-zinc-800 bg-black px-3 py-2 text-xs outline-none focus:border-zinc-500"
                          onChange={(event) => setRoomPassword(event.target.value)}
                          placeholder="New password, blank keeps old one"
                          type="password"
                          value={roomPassword}
                        />
                        <button
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2 text-xs font-bold text-black transition-colors hover:bg-zinc-200 disabled:opacity-50"
                          disabled={roomActionLoading}
                          onClick={handleRoomUpdate}
                          type="button"
                        >
                          <Save size={14} />
                          Save changes
                        </button>
                      </div>
                    ) : null}
                    <button
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-900/60 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-950 disabled:opacity-50"
                      disabled={roomActionLoading}
                      onClick={handleDeleteRoom}
                      type="button"
                    >
                      <Trash2 size={14} />
                      Delete room for everyone
                    </button>
                  </div>
                ) : (
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-black/50 py-3 text-xs font-bold text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
                    disabled={roomActionLoading}
                    onClick={handleLeaveRoom}
                    type="button"
                  >
                    <DoorOpen size={14} />
                    Leave room permanently
                  </button>
                )}
              </div>
            ))}

            {renderAccordionPanel("presence", "Presence", Users, (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black/50 p-3">
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">
                      {presenceSummary.onlineCount}/{presenceSummary.totalCount} present
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-600">
                      Room scoped to {displayCode}
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-900/70 bg-emerald-950/30 px-2 py-1 text-[10px] font-bold text-emerald-300">
                    Live
                  </span>
                </div>

                <div className="space-y-2">
                  {participants.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-800 bg-black/40 p-4 text-xs text-zinc-500">
                      Waiting for room presence...
                    </div>
                  ) : (
                    participants.map((participant) => {
                      const isOnline = participant.status === "online";
                      const displayName = participantName(participant, currentUserId);

                      return (
                        <div
                          className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black/50 p-3"
                          key={participant.id}
                        >
                          {participant.picture ? (
                            <img
                              alt=""
                              className="h-9 w-9 rounded-xl object-cover ring-1 ring-zinc-800"
                              src={participant.picture}
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-[11px] font-bold text-zinc-400 ring-1 ring-zinc-800">
                              {participantInitials(displayName)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-zinc-100">
                                {displayName}
                              </p>
                              {participant.role === "host" ? (
                                <span className="rounded-full bg-amber-950/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                                  Host
                                </span>
                              ) : null}
                            </div>
                            <p className={participant.isTyping ? "text-xs text-sky-300" : "text-xs text-zinc-500"}>
                              {participant.isTyping
                                ? `Editing line ${participant.typingLine || 1}`
                                : isOnline
                                  ? "Present in editor"
                                  : "Not present"}
                            </p>
                          </div>
                          <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-emerald-400" : "bg-zinc-700"}`} />
                          {isHost && participant.role !== "host" && String(participant.id) !== currentUserId ? (
                            <button
                              className="rounded-full border border-red-900/60 p-2 text-red-300 transition-colors hover:bg-red-950 disabled:opacity-50"
                              disabled={roomActionLoading}
                              onClick={() => handleRemoveMember(participant)}
                              title="Remove member"
                              type="button"
                            >
                              <UserMinus size={13} />
                            </button>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>

                {typingUser ? (
                  <div className="rounded-2xl border border-sky-900/60 bg-sky-950/30 p-3 text-xs text-sky-300">
                    {typingUser} is typing right now.
                  </div>
                ) : null}
              </div>
            ))}

            {renderAccordionPanel("activity", "Last Activity", Activity, (
              lastActor ? (
                <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-black/50 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                    {lastActor[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{lastActor}</span>
                </div>
              ) : (
                <p className="text-xs italic text-zinc-600">No activity recorded yet.</p>
              )
            ))}

            {renderAccordionPanel("sync", "Sync Architecture", Shield, (
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-[10px] text-zinc-600">Protocol</p>
                  <p className="text-sm leading-relaxed text-zinc-300">
                    Server-authoritative deltas with versioned position shifting.
                  </p>
                </div>
                <div className="h-px bg-zinc-800"></div>
                <div>
                  <p className="mb-1 text-[10px] text-zinc-600">Conflict Resolution</p>
                  <p className="text-sm leading-relaxed text-zinc-300">
                    Stale patches are transformed against accepted history before commit.
                  </p>
                </div>
              </div>
            ))}
          </aside>
        </main>
      </div>
    </div>
  );
}
