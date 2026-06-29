import { createBrowserRouter, Navigate } from "react-router-dom";
import { PrivateLayout } from "../layouts/PrivateLayout.jsx";
import { PublicLayout } from "../layouts/PublicLayout.jsx";
import { GoogleAuthPage } from "../../features/auth/pages/GoogleAuthPage.jsx";
import { EditorRoomPage } from "../../features/editor/pages/EditorRoomPage.jsx";
import { RoomLobbyPage } from "../../features/rooms/pages/RoomLobbyPage.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <Navigate to="/auth" replace /> },
      { path: "auth", element: <GoogleAuthPage /> },
      { path: "join/:roomCode", element: <GoogleAuthPage /> },
    ],
  },
  {
    path: "/app",
    element: <PrivateLayout />,
    children: [
      { index: true, element: <RoomLobbyPage /> },
      { path: "rooms/:roomCode", element: <EditorRoomPage /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/auth" replace />,
  },
]);
