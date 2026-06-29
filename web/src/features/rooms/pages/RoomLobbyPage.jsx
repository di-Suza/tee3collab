import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import RoomService from "../services/room.service.js";
import { setCurrentRoom, setLoading, setError } from "../roomsSlice.js";

export function RoomLobbyPage() {
  const [joining, setJoining] = useState(false);
  const [searchParams] = useSearchParams();
  const [roomCode, setRoomCode] = useState(searchParams.get("joinRoomCode") || "");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [createRoomCode, setCreateRoomCode] = useState("");
  const [createPassword, setCreatePassword] = useState("");

  const handleCreate = async () => {
    try {
      dispatch(setLoading(true));
      const res = await RoomService.createRoom(createRoomCode, createPassword, []);
      dispatch(setCurrentRoom(res.data.room));
      navigate(`/app/rooms/${res.data.room.roomCode}`);
    } catch (err) {
      dispatch(setError(err.response?.data?.message || err.message || "Failed to create room"));
    }
  };

  const handleJoin = async () => {
    try {
      setJoining(true);
      dispatch(setLoading(true));
      const payload = { roomCode, password };
      const res = await RoomService.joinRoom(payload);
      dispatch(setCurrentRoom(res.data.room));
      navigate(`/app/rooms/${res.data.room.roomCode}`);
    } catch (err) {
      dispatch(setError(err.response?.data?.message || err.message || "Failed to join room"));
    } finally {
      setJoining(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6">
      <p className="text-sm uppercase tracking-wide text-emerald-300">Room Lobby</p>
      <h1 className="mt-3 text-3xl font-semibold">Dashboard</h1>

      <div className="mt-6 flex flex-col gap-4">
        <div className="grid gap-3 rounded border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm uppercase tracking-wide text-emerald-300">Create a room</p>
          <input
            value={createRoomCode}
            onChange={(e) => setCreateRoomCode(e.target.value.toUpperCase())}
            placeholder="Room code (6 chars)"
            className="rounded bg-zinc-900 px-3 py-2"
          />
          <input
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
            placeholder="Password"
            className="rounded bg-zinc-900 px-3 py-2"
          />
          <button
            onClick={handleCreate}
            className="rounded bg-emerald-600 px-4 py-2 text-white"
          >
            Create Room
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Room code"
            className="rounded bg-zinc-900 px-3 py-2"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="rounded bg-zinc-900 px-3 py-2"
          />
          <button
            onClick={handleJoin}
            className="rounded bg-sky-600 px-4 py-2 text-white"
            disabled={joining}
          >
            Join
          </button>
        </div>
      </div>
    </section>
  );
}
