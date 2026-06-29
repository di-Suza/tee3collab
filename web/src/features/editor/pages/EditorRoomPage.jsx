import Editor from "@monaco-editor/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { DocumentService } from "../services/document.service.js";
import { EditorSocketService } from "../services/editor-socket.service.js";
import {
  applyPatchToText,
  createClientId,
  createPatchFromChange,
} from "../utils/text-patch.js";

export function EditorRoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const room = useSelector((state) => state.rooms.currentRoom);

  const displayCode = room?.roomCode || roomCode;
  const joinLink = room?.joinLink || `${window.location.origin}/join/${displayCode}`;

  const [content, setContent] = useState("");
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [lastActor, setLastActor] = useState(null);
  const [conflict, setConflict] = useState(null);

  const socketRef = useRef(null);
  const clientIdRef = useRef("");
  const contentRef = useRef("");
  const versionRef = useRef(0);
  const applyingRemoteRef = useRef(false);
  const typingTimerRef = useRef(null);
  const remoteTypingTimerRef = useRef(null);

  const applySnapshot = useCallback((snapshot) => {
    applyingRemoteRef.current = true;
    contentRef.current = snapshot.content || "";
    versionRef.current = snapshot.version || 0;
    setContent(snapshot.content || "");
    setVersion(snapshot.version || 0);
    setLoading(false);
    window.setTimeout(() => {
      applyingRemoteRef.current = false;
    }, 0);
  }, []);

  const reloadSnapshot = useCallback(async () => {
    const snapshot = await DocumentService.getDocument(displayCode);
    applySnapshot(snapshot);
  }, [applySnapshot, displayCode]);

  useEffect(() => {
    clientIdRef.current = createClientId();

    let mounted = true;
    const socketService = new EditorSocketService();
    socketRef.current = socketService;

    DocumentService.getDocument(displayCode)
      .then((snapshot) => {
        if (mounted) {
          applySnapshot(snapshot);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.response?.data?.message || err.message || "Unable to load document");
          setLoading(false);
        }
      });

    socketService.onConnectionChange(setConnected);
    socketService.onSnapshot((snapshot) => {
      if (mounted) {
        applySnapshot(snapshot);
      }
    });

    socketService.onPatchApplied(async (payload) => {
      if (!mounted) {
        return;
      }

      const patch = payload.patch;
      const isOwnPatch = patch.clientId === clientIdRef.current;
      versionRef.current = payload.version;
      setVersion(payload.version);
      setLastActor(payload.actor?.name || "Someone");
      setConflict(payload.conflict || null);

      if (isOwnPatch) {
        if (payload.conflict) {
          await reloadSnapshot();
        }
        return;
      }

      applyingRemoteRef.current = true;
      const nextContent = applyPatchToText(contentRef.current, patch);
      contentRef.current = nextContent;
      setContent(nextContent);
      window.setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 0);
    });

    socketService.onTyping((payload) => {
      if (!mounted) {
        return;
      }

      if (payload.isTyping) {
        setTypingUser(payload.actor?.name || "Someone");
        window.clearTimeout(remoteTypingTimerRef.current);
        remoteTypingTimerRef.current = window.setTimeout(() => setTypingUser(null), 1800);
      } else {
        setTypingUser(null);
      }
    });

    socketService.onSyncError((payload) => {
      if (mounted) {
        setError(payload.message || "Document sync failed");
      }
    });

    socketService.joinDocument(displayCode);

    return () => {
      mounted = false;
      window.clearTimeout(typingTimerRef.current);
      window.clearTimeout(remoteTypingTimerRef.current);
      socketService.disconnect();
    };
  }, [applySnapshot, displayCode, reloadSnapshot]);

  const handleEditorChange = useCallback(
    (nextValue = "") => {
      if (applyingRemoteRef.current || loading) {
        return;
      }

      const previousContent = contentRef.current;
      const nextContent = nextValue || "";
      const patch = createPatchFromChange(
        previousContent,
        nextContent,
        versionRef.current,
        clientIdRef.current,
      );

      contentRef.current = nextContent;
      setContent(nextContent);

      if (!patch) {
        return;
      }

      setError("");
      socketRef.current?.startTyping(displayCode);
      socketRef.current?.sendPatch(displayCode, patch, (ack) => {
        if (!ack?.ok) {
          setError(ack?.error?.message || "Patch was rejected by the server");
        }
      });

      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = window.setTimeout(() => {
        socketRef.current?.stopTyping(displayCode);
      }, 800);
    },
    [displayCode, loading],
  );

  return (
    <section className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-300">CodeRoom</p>
            <h1 className="mt-1 text-xl font-semibold">{displayCode}</h1>
          </div>
          <button
            className="rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
            onClick={() => navigate("/app")}
            type="button"
          >
            Back
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_320px]">
        <div className="min-h-0 border-r border-zinc-800">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
              <span className={connected ? "text-emerald-300" : "text-amber-300"}>
                {connected ? "Connected" : "Connecting"}
              </span>
              <span className="text-zinc-500">Version {version}</span>
              {lastActor ? <span className="text-zinc-400">Last edit by {lastActor}</span> : null}
            </div>
            {typingUser ? <span className="text-sky-300">{typingUser} is typing</span> : null}
          </div>

          {error ? (
            <div className="border-b border-red-900 bg-red-950 px-4 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {conflict ? (
            <div className="border-b border-amber-900 bg-amber-950 px-4 py-2 text-sm text-amber-100">
              {conflict.reason}
            </div>
          ) : null}

          <div className="h-[calc(100vh-132px)] min-h-[520px]">
            <Editor
              height="100%"
              language="javascript"
              loading="Loading editor..."
              onChange={handleEditorChange}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                quickSuggestions: false,
                wordBasedSuggestions: "off",
                suggestOnTriggerCharacters: false,
                tabCompletion: "off",
                wordWrap: "on",
              }}
              theme="vs-dark"
              value={content}
            />
          </div>
        </div>

        <aside className="min-h-0 overflow-y-auto bg-zinc-950 px-5 py-5">
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Room code</p>
              <p className="mt-2 rounded-md bg-zinc-900 px-3 py-2 font-mono text-sm">{displayCode}</p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Join link</p>
              <p className="mt-2 break-all rounded-md bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
                {joinLink}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Sync strategy</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Server-authoritative deltas with versioned position shifting.
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Conflict behavior</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Stale patches are transformed against accepted patch history before being saved.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
