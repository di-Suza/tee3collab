import { useParams } from "react-router-dom";

export function EditorRoomPage() {
  const { roomCode } = useParams();

  return (
    <section className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 px-6 py-4">
        <p className="text-sm text-zinc-400">Active room</p>
        <h1 className="text-xl font-semibold">{roomCode}</h1>
      </header>
      <div className="grid flex-1 grid-cols-[1fr_280px]">
        <div className="p-6">
          {/* Domain B will mount the shared code editor and sync state here. */}
        </div>
        <aside className="border-l border-zinc-800 p-6">
          {/* Domain C will mount presence, typing signal, and participant state here. */}
        </aside>
      </div>
    </section>
  );
}
