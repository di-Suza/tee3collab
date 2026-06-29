import { Outlet } from "react-router-dom";

export function PrivateLayout() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Private layout shell: add authenticated nav, room status, and user menu here later. */}
      <Outlet />
    </main>
  );
}
