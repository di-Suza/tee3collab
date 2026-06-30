import {
  ArrowRight,
  Copy,
  DoorOpen,
  History,
  Plus,
  RefreshCw,
  Save,
  UserRound,
  XCircle,
  Zap,
  Key,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthService from "../../auth/services/auth.service.js";
import { setUser } from "../../auth/authSlice.js";
import RoomService from "../services/room.service.js";
import { setCurrentRoom, setRoomHistory, setLoading, setError } from "../roomsSlice.js";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode() {
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

function formatDate(value) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function RoomLobbyPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSelector((state) => state.auth.user);
  const rooms = useSelector((state) => state.rooms);
  const pendingInviteRoomCode = searchParams.get("joinRoomCode");

  const [activeMode, setActiveMode] = useState(pendingInviteRoomCode ? "join" : "create");
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [localMessage, setLocalMessage] = useState("");
  const [createRoomCode, setCreateRoomCode] = useState(generateRoomCode);
  const [createPassword, setCreatePassword] = useState("");
  const [joinRoomCode, setJoinRoomCode] = useState(pendingInviteRoomCode || "");
  const [joinPassword, setJoinPassword] = useState("");
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profilePicture, setProfilePicture] = useState(user?.picture || "");
  const inviteHandledRef = useRef("");

  // --- LOGIC (KEPT EXACTLY THE SAME) ---
  const loadHistory = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const history = await RoomService.getHistory();
      dispatch(setRoomHistory(history));
    } catch (err) {
      dispatch(setError(err.response?.data?.message || err.message || "Failed to load rooms"));
    }
  }, [dispatch]);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  useEffect(() => {
    setProfileName(user?.name || "");
    setProfilePicture(user?.picture || "");
  }, [user]);

  useEffect(() => {
    if (!pendingInviteRoomCode || inviteHandledRef.current === pendingInviteRoomCode) return;
    inviteHandledRef.current = pendingInviteRoomCode;
    setJoinRoomCode(pendingInviteRoomCode);
    setJoining(true);
    setLocalMessage(`Joining ${pendingInviteRoomCode}...`);
    RoomService.joinWithInvite({ roomCode: pendingInviteRoomCode })
      .then((res) => {
        dispatch(setCurrentRoom(res.room));
        navigate(`/app/rooms/${res.room.roomCode}`, { replace: true });
      })
      .catch((err) => {
        dispatch(setError(err.response?.data?.message || err.message || "Invite join failed"));
        setSearchParams({}, { replace: true });
      })
      .finally(() => {
        setJoining(false);
        setLocalMessage("");
      });
  }, [dispatch, navigate, pendingInviteRoomCode, setSearchParams]);

  const handleCreate = async () => {
    try {
      setCreating(true);
      dispatch(setLoading(true));
      const result = await RoomService.createRoom({ roomCode: createRoomCode, password: createPassword, members: [] });
      dispatch(setCurrentRoom(result.room));
      navigate(`/app/rooms/${result.room.roomCode}`);
    } catch (err) {
      dispatch(setError(err.response?.data?.message || err.message || "Failed to create room"));
    } finally { setCreating(false); }
  };

  const handleJoin = async () => {
    try {
      setJoining(true);
      dispatch(setLoading(true));
      const payload = { roomCode: joinRoomCode, password: joinPassword };
      const res = await RoomService.joinRoom(payload);
      dispatch(setCurrentRoom(res.room));
      navigate(`/app/rooms/${res.room.roomCode}`);
    } catch (err) {
      dispatch(setError(err.response?.data?.message || err.message || "Failed to join room"));
    } finally { setJoining(false); }
  };

  const handleOpenRoom = (room) => {
    dispatch(setCurrentRoom(room));
    navigate(`/app/rooms/${room.roomCode}`);
  };

  const handleCloseRoom = async (roomCode) => {
    try {
      dispatch(setLoading(true));
      await RoomService.closeRoom(roomCode);
      await loadHistory();
    } catch (err) {
      dispatch(setError(err.response?.data?.message || err.message || "Failed to close room"));
    }
  };

  const handleProfileSave = async () => {
    try {
      setSavingProfile(true);
      const result = await AuthService.updateMe({ name: profileName, picture: profilePicture });
      dispatch(setUser(result.data.user));
      setProfileEditing(false);
      setLocalMessage("Profile saved");
    } catch (err) {
      dispatch(setError(err.response?.data?.message || err.message || "Failed to save profile"));
    } finally { setSavingProfile(false); }
  };

  const handleCopy = async (text) => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(text);
    setLocalMessage("Copied");
  };

  // Modernized Room List Renderer
  const renderRoomList = (title, list, emptyText) => (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">{title}</h2>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{list.length}</span>
      </div>
      <div className="space-y-3">
        {list.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-800 px-4 py-6 text-center text-xs text-zinc-600">
            {emptyText}
          </p>
        ) : (
          list.map((room) => (
            <div key={room.id || room.roomCode} className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 hover:border-zinc-600 transition-all">
              <div className="flex items-center justify-between">
                <div className="cursor-pointer" onClick={() => handleOpenRoom(room)}>
                  <span className="block font-mono text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">{room.roomCode}</span>
                  <span className="mt-1 block text-[10px] text-zinc-500">
                    {room.status} • {room.memberCount} users • {formatDate(room.updatedAt)}
                  </span>
                </div>
                <button
                  onClick={() => handleOpenRoom(room)}
                  className="h-8 w-8 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-white hover:text-black transition-all"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
              {room.isHost && room.status === "open" && (
                <button
                  onClick={() => handleCloseRoom(room.roomCode)}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-red-900/50 py-1 text-[10px] text-red-400 hover:bg-red-950 transition-all"
                >
                  <XCircle size={12} /> Close Session
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

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
      <div className="min-h-screen w-full bg-black/80 backdrop-blur-sm">
        
        {/* --- NAVBAR --- */}
        <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
              <span className="text-black font-bold text-xl">&lt;/&gt;</span>
            </div>
            <span className="text-xl font-semibold tracking-tight">Darkweb X</span>
          </div>
          <button onClick={loadHistory} className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-all">
            <RefreshCw size={14} className={rooms.loading ? "animate-spin" : ""} />
            Sync History
          </button>
        </nav>

        <main className="max-w-7xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-[350px_1fr_320px] gap-12">
          
          {/* --- LEFT: HISTORY LOG --- */}
          <aside className="space-y-8">
            <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium mb-6">
              <History size={16} />
              <span>Session Logs</span>
            </div>
            {renderRoomList("Hosted", rooms.createdRooms, "No rooms hosted yet")}
            {renderRoomList("Participated", rooms.joinedRooms, "No joined rooms yet")}
          </aside>

          {/* --- CENTER: ACTION HUB --- */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full max-w-xl">
              {/* Alerts */}
              {(pendingInviteRoomCode || localMessage || rooms.error) && (
                <div className={`mb-6 p-4 rounded-2xl text-sm border backdrop-blur-md transition-all ${
                  rooms.error ? "bg-red-950/50 border-red-800 text-red-200" : "bg-emerald-950/50 border-emerald-800 text-emerald-200"
                }`}>
                  {rooms.error || localMessage || `Invite ready for ${pendingInviteRoomCode}`}
                </div>
              )}

              {/* Mode Switcher */}
              <div className="mb-8 p-1.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl flex gap-2 backdrop-blur-md">
                <button
                  onClick={() => setActiveMode("create")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeMode === "create" ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Plus size={16} /> Create
                </button>
                <button
                  onClick={() => setActiveMode("join")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                    activeMode === "join" ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <DoorOpen size={16} /> Join
                </button>
              </div>

              {/* Input Cards */}
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 backdrop-blur-md hover:border-zinc-600 transition-all relative group">
                {activeMode === "create" ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight">Initialize Room</h2>
                        <p className="text-zinc-500 text-xs">Generate a secure collaboration space</p>
                      </div>
                      <button onClick={() => setCreateRoomCode(generateRoomCode())} className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-all">
                        <RefreshCw size={16} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 ml-1">Room Code</label>
                        <input
                          className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 font-mono text-sm outline-none focus:border-white transition-all"
                          maxLength={6}
                          onChange={(e) => setCreateRoomCode(e.target.value.toUpperCase())}
                          value={createRoomCode}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 ml-1">Access Password</label>
                        <input
                          className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-white transition-all"
                          onChange={(e) => setCreatePassword(e.target.value)}
                          placeholder="Optional password"
                          type="password"
                          value={createPassword}
                        />
                      </div>
                      <button
                        onClick={handleCreate}
                        disabled={creating || rooms.loading}
                        className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-zinc-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Zap size={18} /> {creating ? "Provisioning..." : "Create Room"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="mb-4">
                      <h2 className="text-2xl font-bold tracking-tight">Enter Session</h2>
                      <p className="text-zinc-500 text-xs">Join your teammates via Room ID</p>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 ml-1">Room Code</label>
                        <input
                          className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 font-mono text-sm outline-none focus:border-white transition-all"
                          maxLength={6}
                          onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                          value={joinRoomCode}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 ml-1">Room Password</label>
                        <input
                          className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-white transition-all"
                          onChange={(e) => setJoinPassword(e.target.value)}
                          placeholder="Enter password"
                          type="password"
                          value={joinPassword}
                        />
                      </div>
                      <button
                        onClick={handleJoin}
                        disabled={joining || rooms.loading}
                        className="w-full bg-zinc-100 text-black py-4 rounded-2xl font-bold hover:bg-white transition-all transform active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Key size={18} /> {joining ? "Connecting..." : "Join Room"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- RIGHT: USER PROFILE & QUICK ACTIONS --- */}
          <aside className="space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 backdrop-blur-md hover:border-zinc-600 transition-all">
              <div className="flex items-center gap-4 mb-6">
                {profilePicture ? (
                  <img alt="User" className="h-14 w-14 rounded-2xl object-cover ring-2 ring-zinc-800" src={profilePicture} />
                ) : (
                  <div className="h-14 w-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <UserRound size={24} />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{user?.name || "Developer"}</p>
                  <p className="truncate text-xs text-zinc-500">{user?.email}</p>
                </div>
              </div>

              {profileEditing ? (
                <div className="space-y-4">
                  <input
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-white"
                    onChange={(e) => setProfileName(e.target.value)}
                    value={profileName}
                  />
                  <input
                    className="w-full bg-black border border-zinc-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-white"
                    onChange={(e) => setProfilePicture(e.target.value)}
                    value={profilePicture}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleProfileSave} disabled={savingProfile} className="bg-white text-black py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                      <Save size={14} /> Save
                    </button>
                    <button onClick={() => setProfileEditing(false)} className="border border-zinc-700 py-2 rounded-xl text-xs text-zinc-300">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setProfileEditing(true)} className="w-full py-2 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
                  <UserRound size={14} /> Edit Profile
                </button>
              )}
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 backdrop-blur-md">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3">Quick Invite</p>
              <div className="p-3 bg-black border border-zinc-700 rounded-xl font-mono text-xs text-zinc-300 break-all mb-3">
                {`${window.location.origin}/join/${createRoomCode}`}
              </div>
              <button
                onClick={() => handleCopy(`${window.location.origin}/join/${createRoomCode}`)}
                className="w-full py-2 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
              >
                <Copy size={14} /> Copy Link
              </button>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
