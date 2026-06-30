import {
  ArrowRight,
  DoorOpen,
  Pencil,
  History,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthService from "../../auth/services/auth.service.js";
import { clearUser, setUser } from "../../auth/authSlice.js";
import RoomService from "../services/room.service.js";
import { setCurrentRoom, setRoomHistory, setLoading, setError } from "../roomsSlice.js";

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

  const [, setJoining] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileEditing, setProfileEditing] = useState(false);
  const [localMessage, setLocalMessage] = useState("");
  const [profileName, setProfileName] = useState(user?.name || "");
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [roomActionCode, setRoomActionCode] = useState("");
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
  }, [user]);

  useEffect(() => {
    if (!pendingInviteRoomCode || inviteHandledRef.current === pendingInviteRoomCode) return;
    inviteHandledRef.current = pendingInviteRoomCode;
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

  const handleOpenRoom = (room) => {
    dispatch(setCurrentRoom(room));
    navigate(`/app/rooms/${room.roomCode}`);
  };

  const refreshHistoryAfterAction = async (message) => {
    await loadHistory();
    setLocalMessage(message);
  };

  const handleStartRoomEdit = (room) => {
    setEditingRoom(room);
    setRoomName(room.name || "");
    setRoomDescription(room.description || "");
    setRoomPassword("");
  };

  const handleRoomUpdate = async () => {
    if (!editingRoom) return;

    try {
      setRoomActionCode(editingRoom.roomCode);
      const payload = {
        name: roomName,
        description: roomDescription,
      };

      if (roomPassword) {
        payload.password = roomPassword;
      }

      const result = await RoomService.updateRoom(editingRoom.roomCode, payload);
      dispatch(setCurrentRoom(result.room));
      setEditingRoom(null);
      setRoomPassword("");
      await refreshHistoryAfterAction("Room details updated");
    } catch (err) {
      dispatch(setError(err.response?.data?.message || err.message || "Failed to update room"));
    } finally {
      setRoomActionCode("");
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Delete room ${room.roomCode}? This removes it for everyone.`)) return;

    try {
      setRoomActionCode(room.roomCode);
      await RoomService.deleteRoom(room.roomCode);
      await refreshHistoryAfterAction("Room deleted");
    } catch (err) {
      dispatch(setError(err.response?.data?.message || err.message || "Failed to delete room"));
    } finally {
      setRoomActionCode("");
    }
  };

  const handleLeaveRoom = async (room) => {
    if (!window.confirm(`Leave room ${room.roomCode} permanently?`)) return;

    try {
      setRoomActionCode(room.roomCode);
      await RoomService.leaveRoom(room.roomCode);
      await refreshHistoryAfterAction("Room left");
    } catch (err) {
      dispatch(setError(err.response?.data?.message || err.message || "Failed to leave room"));
    } finally {
      setRoomActionCode("");
    }
  };

  const handleProfileSave = async () => {
    try {
      setSavingProfile(true);
      const result = await AuthService.updateMe({ name: profileName });
      dispatch(setUser(result.data.user));
      setProfileEditing(false);
      setLocalMessage("Profile saved");
    } catch (err) {
      dispatch(setError(err.response?.data?.message || err.message || "Failed to save profile"));
    } finally { setSavingProfile(false); }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    dispatch(clearUser());
    navigate("/", { replace: true });
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
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleOpenRoom(room)}>
                  <span className="block truncate text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">
                    {room.name || "Untitled Room"}
                  </span>
                  <span className="mt-1 block font-mono text-[11px] text-zinc-500">{room.roomCode}</span>
                  <span className="mt-1 block text-[10px] text-zinc-500">
                    {room.status === "open" ? "Active" : "Inactive"} - {room.memberCount} users - {formatDate(room.updatedAt)}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {room.isHost ? (
                    <>
                      <button
                        onClick={() => handleStartRoomEdit(room)}
                        className="h-8 w-8 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-50"
                        disabled={roomActionCode === room.roomCode}
                        type="button"
                        title="Edit room"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room)}
                        className="h-8 w-8 rounded-full border border-red-900/60 flex items-center justify-center text-red-300 hover:bg-red-950 transition-all disabled:opacity-50"
                        disabled={roomActionCode === room.roomCode}
                        type="button"
                        title="Delete room"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleLeaveRoom(room)}
                      className="h-8 w-8 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all disabled:opacity-50"
                      disabled={roomActionCode === room.roomCode}
                      type="button"
                      title="Leave room"
                    >
                      <DoorOpen size={13} />
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenRoom(room)}
                    className="h-8 w-8 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-white hover:text-black transition-all"
                    type="button"
                    title="Open room"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
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
        {editingRoom ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                    Host Controls
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">Edit room</h2>
                  <p className="mt-1 font-mono text-xs text-zinc-500">{editingRoom.roomCode}</p>
                </div>
                <button
                  className="rounded-full border border-zinc-800 p-2 text-zinc-500 transition-colors hover:text-white"
                  onClick={() => setEditingRoom(null)}
                  type="button"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-widest text-zinc-600">
                    Room Name
                  </label>
                  <input
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm outline-none transition-colors focus:border-zinc-500"
                    maxLength={80}
                    onChange={(event) => setRoomName(event.target.value)}
                    value={roomName}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-widest text-zinc-600">
                    Description
                  </label>
                  <textarea
                    className="h-24 w-full resize-none rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm outline-none transition-colors focus:border-zinc-500"
                    maxLength={240}
                    onChange={(event) => setRoomDescription(event.target.value)}
                    value={roomDescription}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] uppercase tracking-widest text-zinc-600">
                    New Password
                  </label>
                  <input
                    className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm outline-none transition-colors focus:border-zinc-500"
                    onChange={(event) => setRoomPassword(event.target.value)}
                    placeholder="Leave blank to keep current password"
                    type="password"
                    value={roomPassword}
                  />
                </div>
              </div>

              <button
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-bold text-black transition-all hover:bg-zinc-200 disabled:opacity-50"
                disabled={roomActionCode === editingRoom.roomCode}
                onClick={handleRoomUpdate}
                type="button"
              >
                <Save size={16} />
                Save room changes
              </button>
            </div>
          </div>
        ) : null}
        
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

              <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 backdrop-blur-md hover:border-zinc-600 transition-all">
                <div className="mb-8 text-center">
                  <h2 className="text-3xl font-bold tracking-tight">Collaboration Hub</h2>
                  <p className="mt-3 text-sm text-zinc-500">
                    Start a fresh coding session or join an existing room.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => navigate("/app/create-lobby")}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-bold text-black transition-all hover:bg-zinc-200 active:scale-95"
                    type="button"
                  >
                    <Plus size={18} />
                    Create Room
                  </button>
                  <button
                    onClick={() => navigate("/app/join-lobby")}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-5 py-4 text-sm font-bold text-black transition-all hover:bg-white active:scale-95"
                    type="button"
                  >
                    <DoorOpen size={18} />
                    Join Room
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* --- RIGHT: USER PROFILE & QUICK ACTIONS --- */}
          <aside className="space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 backdrop-blur-md hover:border-zinc-600 transition-all">
              <div className="flex items-center gap-4 mb-6">
                {user?.picture ? (
                  <img alt="User" className="h-14 w-14 rounded-2xl object-cover ring-2 ring-zinc-800" src={user.picture} />
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
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleProfileSave} disabled={savingProfile} className="bg-white text-black py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1">
                      <Save size={14} /> Save
                    </button>
                    <button onClick={() => setProfileEditing(false)} className="border border-zinc-700 py-2 rounded-xl text-xs text-zinc-300">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <button onClick={() => setProfileEditing(true)} className="w-full py-2 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
                    <UserRound size={14} /> Edit Profile
                  </button>
                  <button onClick={handleLogout} className="w-full py-2 rounded-xl border border-red-900/50 text-xs text-red-300 hover:bg-red-950 transition-all flex items-center justify-center gap-2">
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
