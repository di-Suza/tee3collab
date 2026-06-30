import { Outlet, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AuthService from "../../features/auth/services/auth.service.js";
import { setUser, setLoading, setError } from "../../features/auth/authSlice.js";

export function PrivateLayout() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    if (!user) {
      dispatch(setLoading(true));
      AuthService.getMe()
        .then((res) => {
          dispatch(setUser(res.data.user));
        })
        .catch((err) => {
          dispatch(setError(err.message || "Authentication required"));
        })
        .finally(() => setInitialised(true));
    } else {
      setInitialised(true);
    }
  }, [dispatch, user]);

  if (!initialised) {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-50">
        <div className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center text-white">
          Loading dashboard...
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Private layout shell: add authenticated nav, room status, and user menu here later. */}
      <Outlet />
    </main>
  );
}
