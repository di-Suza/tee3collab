import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export function EditorRoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const room = useSelector((state) => state.rooms.currentRoom);

  const displayCode = room?.roomCode || roomCode;
  const displayPassword = room?.password || "(hidden)";
  const joinLink = room?.joinLink || `${window.location.origin}/join/${displayCode}`;

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 bg-zinc-950 px-6 py-8 text-zinc-50">
      <header className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl shadow-black/20">
        <p className="text-sm uppercase tracking-wide text-emerald-300">Room Dashboard</p>
        <div className="mt-3 flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">{displayCode}</h1>
          <p className="text-sm text-zinc-400">Your active room is ready for collaboration.</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-semibold">Room details</h2>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <div>
              <p className="text-zinc-400">Room code</p>
              <p className="mt-1 rounded bg-zinc-950 px-3 py-2 font-medium">{displayCode}</p>
            </div>
            <div>
              <p className="text-zinc-400">Password</p>
              <p className="mt-1 rounded bg-zinc-950 px-3 py-2 font-medium">{displayPassword}</p>
            </div>
            <div>
              <p className="text-zinc-400">Join link</p>
              <p className="mt-1 break-all rounded bg-zinc-950 px-3 py-2 font-medium">{joinLink}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500"
              onClick={() => navigate("/app")}
            >
              Back to lobby
            </button>
          </div>
        </div>

        <aside className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-semibold">Room actions</h2>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <p>
              Use this dashboard to confirm room details after creating or joining. The editor and collaboration experience will be built into this room view.
            </p>
            <p>
              If you want, I can add live participants, chat, and editor state to this dashboard next.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
