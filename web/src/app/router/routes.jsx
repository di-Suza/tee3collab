import { createBrowserRouter, Navigate } from "react-router-dom";
import { PrivateLayout } from "../layouts/PrivateLayout.jsx";
import { PublicLayout } from "../layouts/PublicLayout.jsx";
import { GoogleAuthPage } from "../../features/auth/pages/GoogleAuthPage.jsx";
import { EditorRoomPage } from "../../features/editor/pages/EditorRoomPage.jsx";
import { RoomLobbyPage } from "../../features/rooms/pages/RoomLobbyPage.jsx";
import HomePage from "../../features/auth/pages/HomePage.jsx";
import JoinLobby from "../../features/rooms/pages/JoinLobby.jsx";
import CreateLobby from "../../features/rooms/pages/CreateLobby.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "auth", element: <GoogleAuthPage /> },
      { path: "auth/success", element: <GoogleAuthPage /> },
      { path: "join/:roomCode", element: <GoogleAuthPage /> },
    ],
  },
  {
    path: "/app",
    element: <PrivateLayout />,
    children: [
      { index: true, element: <RoomLobbyPage /> },
      { path: "rooms/:roomCode", element: <EditorRoomPage /> },
      { path: "create-lobby", element: <CreateLobby /> },
      { path: "join-lobby", element: <JoinLobby /> },
    ],
  },

  
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
