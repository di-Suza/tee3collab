import { useParams } from "react-router-dom";

export function GoogleAuthPage() {
  const { roomCode } = useParams();

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <p className="text-sm uppercase tracking-wide text-emerald-300">CodeRoom</p>
      <h1 className="mt-3 text-3xl font-semibold">Auth Shell</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-300">
        {roomCode ? `Pending join room code: ${roomCode}` : "Public auth route placeholder."}
      </p>
      {/* Domain A will add Continue with Google and post-login room action UI here. */}
    </section>
  );
}
