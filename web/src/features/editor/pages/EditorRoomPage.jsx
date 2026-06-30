import Editor from "@monaco-editor/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { DocumentService } from "../services/document.service.js";
import { EditorSocketService } from "../services/editor-socket.service.js";
import {
  applyPatchToText,
  createClientId,
  createPatchFromChange,
} from "../utils/text-patch.js";
import { ArrowLeft, Copy, Zap, Shield, Globe } from "lucide-react";

export function EditorRoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const room = useSelector((state) => state.rooms.currentRoom);

  const displayCode = room?.roomCode || roomCode;
  const createdRoomInvite = location.state?.createdRoomInvite || null;

  const [content, setContent] = useState("");
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const [lastActor, setLastActor] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(Boolean(createdRoomInvite));

  const socketRef = useRef(null);
  const clientIdRef = useRef("");
  const contentRef = useRef("");
  const versionRef = useRef(0);
  const applyingRemoteRef = useRef(false);
  const typingTimerRef = useRef(null);
  const remoteTypingTimerRef = useRef(null);

  // --- LOGIC (KEPT EXACTLY THE SAME) ---
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
        if (mounted) applySnapshot(snapshot);
      })
      .catch((err) => {
        if (mounted) {
          setError(err.response?.data?.message || err.message || "Unable to load document");
          setLoading(false);
        }
      });

    socketService.onConnectionChange(setConnected);
    socketService.onSnapshot((snapshot) => {
      if (mounted) applySnapshot(snapshot);
    });

    socketService.onPatchApplied(async (payload) => {
      if (!mounted) return;
      const patch = payload.patch;
      const isOwnPatch = patch.clientId === clientIdRef.current;
      versionRef.current = payload.version;
      setVersion(payload.version);
      setLastActor(payload.actor?.name || "Someone");
      setConflict(payload.conflict || null);

      if (isOwnPatch) {
        if (payload.conflict) await reloadSnapshot();
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
      if (!mounted) return;
      if (payload.isTyping) {
        setTypingUser(payload.actor?.name || "Someone");
        window.clearTimeout(remoteTypingTimerRef.current);
        remoteTypingTimerRef.current = window.setTimeout(() => setTypingUser(null), 1800);
      } else {
        setTypingUser(null);
      }
    });

    socketService.onSyncError((payload) => {
      if (mounted) setError(payload.message || "Document sync failed");
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
      if (applyingRemoteRef.current || loading) return;
      const previousContent = contentRef.current;
      const nextContent = nextValue || "";
      const patch = createPatchFromChange(previousContent, nextContent, versionRef.current, clientIdRef.current);
      contentRef.current = nextContent;
      setContent(nextContent);
      if (!patch) return;
      setError("");
      socketRef.current?.startTyping(displayCode);
      socketRef.current?.sendPatch(displayCode, patch, (ack) => {
        if (!ack?.ok) setError(ack?.error?.message || "Patch was rejected by the server");
      });
      window.clearTimeout(typingTimerRef.current);
      typingTimerRef.current = window.setTimeout(() => {
        socketRef.current?.stopTyping(displayCode);
      }, 800);
    },
    [displayCode, loading],
  );

  const copyToClipboard = useCallback(async (value) => {
    if (!navigator.clipboard || !value) {
      return;
    }

    await navigator.clipboard.writeText(value);
  }, []);

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

  return (
    <div 
      className="min-h-screen w-full text-white font-sans selection:bg-zinc-700"
      style={{
        backgroundImage: "url('https://i.pinimg.com/736x/0c/5a/99/0c5a990ae7e9489192d6f7abf916ae19.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="min-h-screen w-full bg-black/90 backdrop-blur-md">
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
        <nav className="flex items-center justify-between px-8 py-4 border-b border-zinc-800">
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
              className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-zinc-200 transition-all"
            >
              Exit Room
            </button>
          </div>
        </nav>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6">
          
          {/* LEFT: THE EDITOR WINDOW */}
          <div className="flex flex-col min-h-[calc(100vh-140px)]">
            <div className="relative flex-1 bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
              
              {/* Window Controls Top Bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-black/50 border-b border-zinc-800">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  main.js — Darkweb X Editor
                </div>
                <div className="w-12"></div> {/* Spacer for balance */}
              </div>

              {/* Notification Bar */}
              {(error || conflict || typingUser) && (
                <div className="flex items-center justify-between px-4 py-2 text-xs font-medium border-b border-zinc-800 bg-black/40">
                  {error && <span className="text-red-400 flex items-center gap-2">⚠️ {error}</span>}
                  {conflict && <span className="text-amber-400 flex items-center gap-2">⚡ {conflict.reason}</span>}
                  {typingUser && !error && !conflict && (
                    <span className="text-sky-400 animate-pulse flex items-center gap-2">
                      <Zap size={12} /> {typingUser} is typing...
                    </span>
                  )}
                </div>
              )}

              {/* The Monaco Editor */}
              <div className="h-full">
                <Editor
                  height="100%"
                  language="javascript"
                  loading="<div className='h-full w-full flex items-center justify-center text-zinc-500 font-mono'>Loading IDE...</div>"
                  onChange={handleEditorChange}
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    quickSuggestions: true,
                    wordBasedSuggestions: "off",
                    suggestOnTriggerCharacters: true,
                    tabCompletion: "on",
                    wordWrap: "on",
                    padding: { top: 20 },
                  }}
                  theme="vs-dark"
                  value={content}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: INFORMATION PANEL */}
          <aside className="space-y-6">
            
            {/* Room Identity Card */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl backdrop-blur-md hover:border-zinc-600 transition-all">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">
                <Globe size={14} /> Room Identity
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-zinc-600 mb-1">Sesssion ID</p>
                  <div className="flex items-center justify-between bg-black p-3 rounded-xl border border-zinc-800">
                    <span className="font-mono text-sm">{displayCode}</span>
                    <button onClick={() => navigator.clipboard.writeText(displayCode)} className="text-zinc-500 hover:text-white transition-colors">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Specs Card */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl backdrop-blur-md hover:border-zinc-600 transition-all">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">
                <Shield size={14} /> Sync Architecture
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-zinc-600 mb-1">Protocol</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Server-authoritative deltas with versioned position shifting.
                  </p>
                </div>
                <div className="h-px bg-zinc-800"></div>
                <div>
                  <p className="text-[10px] text-zinc-600 mb-1">Conflict Resolution</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Stale patches are transformed against accepted history before commit.
                  </p>
                </div>
              </div>
            </div>

            {/* User Activity Card */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl backdrop-blur-md hover:border-zinc-600 transition-all">
              <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">
                <Zap size={14} /> Last Activity
                
              </div>
              {lastActor ? (
                <div className="flex items-center gap-3 p-3 bg-black/50 rounded-2xl border border-zinc-800">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                    {lastActor[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{lastActor}</span>
                </div>
              ) : (
                <p className="text-xs text-zinc-600 italic">No activity recorded yet.</p>
              )}
            </div>

          </aside>
        </main>
      </div>
    </div>
  );
}
