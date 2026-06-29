import { Outlet } from "react-router-dom";

export function PublicLayout() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Public layout shell: add unauthenticated header/footer components here later. */}
      <Outlet />
    </main>
  );
}
