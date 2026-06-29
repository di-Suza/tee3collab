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
  if (!value) {
    return "Just now";
  }

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

  const loadHistory = useCallback(async () => {
    try {
      dispatch(setLoading(true));
      const history = await RoomService.getHistory();
      dispatch(setRoomHistory(history));
    } catch (err) {
      dispatch(setError(err.response?.data?.message || err.message || "Failed to load rooms"));
    }
  }, [dispatch]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    setProfileName(user?.name || "");
    setProfilePicture(user?.picture || "");
  }, [user]);

  useEffect(() => {
    if (!pendingInviteRoomCode || inviteHandledRef.current === pendingInviteRoomCode) {
      return;
    }

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
      const result = await RoomService.createRoom({
        roomCode: createRoomCode,
        password: createPassword,
        members: [],
      });

      dispatch(setCurrentRoom(result.room));
      navigate(`/app/rooms/${result.room.roomCode}`);
    } catch (err) {
      dispatch(setError(err.response?.data?.message || err.message || "Failed to create room"));
    } finally {
      setCreating(false);
    }
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
    } finally {
      setJoining(false);
    }
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
      const result = await AuthService.updateMe({
        name: profileName,
        picture: profilePicture,
      });

      dispatch(setUser(result.data.user));
      setProfileEditing(false);
      setLocalMessage("Profile saved");
    } catch (err) {
      dispatch(setError(err.response?.data?.message || err.message || "Failed to save profile"));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCopy = async (text) => {
    if (!navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(text);
    setLocalMessage("Copied");
  };

  const renderRoomList = (title, list, emptyText) => (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{title}</h2>
        <span className="text-xs text-zinc-600">{list.length}</span>
      </div>

      <div className="space-y-2">
        {list.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-800 px-3 py-4 text-sm text-zinc-500">
            {emptyText}
          </p>
        ) : (
          list.map((room) => (
            <div
              className="rounded-md border border-zinc-800 bg-zinc-950 p-3"
              key={room.id || room.roomCode}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  className="min-w-0 text-left"
                  onClick={() => handleOpenRoom(room)}
                  type="button"
                >
                  <span className="block font-mono text-sm text-zinc-100">{room.roomCode}</span>
                  <span className="mt-1 block text-xs text-zinc-500">
                    {room.status} - {room.memberCount} members - {formatDate(room.updatedAt)}
                  </span>
                </button>
                <button
                  aria-label={`Open ${room.roomCode}`}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  onClick={() => handleOpenRoom(room)}
                  title="Open room"
                  type="button"
                >
                  <ArrowRight size={16} />
                </button>
              </div>

              {room.isHost && room.status === "open" ? (
                <button
                  className="mt-3 inline-flex items-center gap-2 rounded-md border border-red-900 px-2 py-1 text-xs text-red-300 hover:bg-red-950"
                  onClick={() => handleCloseRoom(room.roomCode)}
                  type="button"
                >
                  <XCircle size={14} />
                  Close
                </button>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-300">CodeRoom</p>
            <h1 className="mt-1 text-2xl font-semibold">Dashboard</h1>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
            onClick={loadHistory}
            type="button"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-73px)] grid-cols-[300px_1fr_320px]">
        <aside className="space-y-7 border-r border-zinc-800 px-5 py-5">
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <History size={16} />
            Room history
          </div>
          {renderRoomList("Created", rooms.createdRooms, "No rooms created yet")}
          {renderRoomList("Joined", rooms.joinedRooms, "No joined rooms yet")}
        </aside>

        <main className="flex items-center justify-center px-8 py-8">
          <div className="w-full max-w-xl">
            {pendingInviteRoomCode || localMessage ? (
              <div className="mb-4 rounded-md border border-emerald-900 bg-emerald-950 px-4 py-3 text-sm text-emerald-100">
                {localMessage || `Invite ready for ${pendingInviteRoomCode}`}
              </div>
            ) : null}

            {rooms.error ? (
              <div className="mb-4 rounded-md border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-100">
                {rooms.error}
              </div>
            ) : null}

            <div className="mb-5 grid grid-cols-2 rounded-md border border-zinc-800 bg-zinc-900 p-1">
              <button
                className={`inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm ${
                  activeMode === "create" ? "bg-emerald-600 text-white" : "text-zinc-400"
                }`}
                onClick={() => setActiveMode("create")}
                type="button"
              >
                <Plus size={16} />
                Create
              </button>
              <button
                className={`inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm ${
                  activeMode === "join" ? "bg-sky-600 text-white" : "text-zinc-400"
                }`}
                onClick={() => setActiveMode("join")}
                type="button"
              >
                <DoorOpen size={16} />
                Join
              </button>
            </div>

            {activeMode === "create" ? (
              <div className="rounded-md border border-zinc-800 bg-zinc-950 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Create room</p>
                    <h2 className="mt-1 text-lg font-semibold">New shared editor</h2>
                  </div>
                  <button
                    aria-label="Generate room code"
                    className="grid h-9 w-9 place-items-center rounded-md border border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                    onClick={() => setCreateRoomCode(generateRoomCode())}
                    title="Generate room code"
                    type="button"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm text-zinc-400">Room code</span>
                    <input
                      className="mt-2 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:border-emerald-600"
                      maxLength={6}
                      onChange={(e) => setCreateRoomCode(e.target.value.toUpperCase())}
                      value={createRoomCode}
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm text-zinc-400">Password</span>
                    <input
                      className="mt-2 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                      onChange={(e) => setCreatePassword(e.target.value)}
                      placeholder="Minimum 4 characters"
                      type="password"
                      value={createPassword}
                    />
                  </label>

                  <button
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={creating || rooms.loading}
                    onClick={handleCreate}
                    type="button"
                  >
                    <Plus size={16} />
                    {creating ? "Creating..." : "Create Room"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-zinc-800 bg-zinc-950 p-5">
                <div className="mb-5">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Join room</p>
                  <h2 className="mt-1 text-lg font-semibold">Enter room credentials</h2>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm text-zinc-400">Room code</span>
                    <input
                      className="mt-2 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-sm outline-none focus:border-sky-600"
                      maxLength={6}
                      onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                      value={joinRoomCode}
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm text-zinc-400">Password</span>
                    <input
                      className="mt-2 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-sky-600"
                      onChange={(e) => setJoinPassword(e.target.value)}
                      placeholder="Room password"
                      type="password"
                      value={joinPassword}
                    />
                  </label>

                  <button
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={joining || rooms.loading}
                    onClick={handleJoin}
                    type="button"
                  >
                    <DoorOpen size={16} />
                    {joining ? "Joining..." : "Join Room"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        <aside className="border-l border-zinc-800 px-5 py-5">
          <div className="rounded-md border border-zinc-800 bg-zinc-950 p-5">
            <div className="mb-5 flex items-center gap-3">
              {profilePicture ? (
                <img
                  alt={profileName || "User avatar"}
                  className="h-12 w-12 rounded-md object-cover"
                  src={profilePicture}
                />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-md bg-zinc-900 text-zinc-400">
                  <UserRound size={22} />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user?.name || "CodeRoom user"}</p>
                <p className="truncate text-xs text-zinc-500">{user?.email}</p>
              </div>
            </div>

            {profileEditing ? (
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm text-zinc-400">Name</span>
                  <input
                    className="mt-2 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                    onChange={(e) => setProfileName(e.target.value)}
                    value={profileName}
                  />
                </label>

                <label className="block">
                  <span className="text-sm text-zinc-400">Avatar URL</span>
                  <input
                    className="mt-2 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                    onChange={(e) => setProfilePicture(e.target.value)}
                    value={profilePicture}
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
                    disabled={savingProfile}
                    onClick={handleProfileSave}
                    type="button"
                  >
                    <Save size={15} />
                    Save
                  </button>
                  <button
                    className="rounded-md border border-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
                    onClick={() => setProfileEditing(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
                onClick={() => setProfileEditing(true)}
                type="button"
              >
                <UserRound size={16} />
                Edit profile
              </button>
            )}
          </div>

          <div className="mt-5 rounded-md border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500">Quick invite</p>
            <p className="mt-2 break-all rounded-md bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-300">
              {`${window.location.origin}/join/${createRoomCode}`}
            </p>
            <button
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
              onClick={() => handleCopy(`${window.location.origin}/join/${createRoomCode}`)}
              type="button"
            >
              <Copy size={16} />
              Copy
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
