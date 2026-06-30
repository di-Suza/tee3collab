import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AuthService from "../../features/auth/services/auth.service.js";
import { setUser } from "../../features/auth/authSlice.js";

export function PublicLayout() {
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const [initialised, setInitialised] = useState(Boolean(user));

  useEffect(() => {
    if (user) {
      setInitialised(true);
      return;
    }

    let mounted = true;

    AuthService.getMe()
      .then((res) => {
        if (mounted) {
          dispatch(setUser(res.data.user));
        }
      })
      .catch(() => {
        if (mounted) {
          setInitialised(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [dispatch, user]);

  const redirectTo = useMemo(() => {
    const pendingRoomCode = AuthService.getPendingJoinRoomCode();
    const joinMatch = location.pathname.match(/^\/join\/([^/]+)/);
    const roomCode = pendingRoomCode || (joinMatch ? decodeURIComponent(joinMatch[1]) : "");

    if (roomCode) {
      return `/app?joinRoomCode=${roomCode}`;
    }

    return "/app";
  }, [location.pathname]);

  useEffect(() => {
    if (user && redirectTo.startsWith("/app?joinRoomCode=")) {
      AuthService.clearPendingJoinRoomCode();
    }
  }, [redirectTo, user]);

  if (!initialised) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-50">
        <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center text-white">
          Checking session...
        </div>
      </main>
    );
  }

  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Public layout shell: add unauthenticated header/footer components here later. */}
      <Outlet />
    </main>
  );
}
