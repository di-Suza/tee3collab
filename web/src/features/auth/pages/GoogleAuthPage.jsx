import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AuthService from "../services/auth.service.js";
import { setUser, setLoading, setError } from "../authSlice.js";

export function GoogleAuthPage() {
  const { roomCode } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (window.location.pathname.includes("/auth/success")) {
      (async () => {
        try {
          dispatch(setLoading(true));
          const res = await AuthService.getMe();
          dispatch(setUser(res.data.user));
          const pendingRoomCode = AuthService.getPendingJoinRoomCode();

          if (pendingRoomCode) {
            AuthService.clearPendingJoinRoomCode();
            navigate(`/app?joinRoomCode=${pendingRoomCode}`, { replace: true });
            return;
          }

          navigate("/app", { replace: true });
        } catch (err) {
          dispatch(setError(err.message || "Failed to fetch user"));
        }
      })();
    } else if (user) {
      const pendingRoomCode = AuthService.getPendingJoinRoomCode() || roomCode;

      if (pendingRoomCode) {
        AuthService.clearPendingJoinRoomCode();
        navigate(`/app?joinRoomCode=${pendingRoomCode}`, { replace: true });
        return;
      }

      navigate("/app", { replace: true });
    }
  }, [dispatch, navigate, roomCode, user]);

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <p className="text-sm uppercase tracking-wide text-emerald-300">CodeRoom</p>
      <h1 className="mt-3 text-3xl font-semibold">Google Sign In</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-300">
        {roomCode
          ? `Pending join room code: ${roomCode}`
          : "Sign in with Google to continue to the room dashboard."}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <a
          className="inline-flex items-center justify-center rounded-md bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20"
          href={AuthService.googleAuthUrl()}
          onClick={() => AuthService.setPendingJoinRoomCode(roomCode)}
        >
          Continue with Google
        </a>

        {user ? (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            onClick={() => navigate("/app")}
          >
            Go to dashboard
          </button>
        ) : null}
      </div>
    </section>
  );
}
