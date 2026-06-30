import { createBrowserRouter, Navigate } from "react-router-dom";
import { PrivateLayout } from "../layouts/PrivateLayout.jsx";
import { PublicLayout } from "../layouts/PublicLayout.jsx";
import { GoogleAuthPage } from "../../features/auth/pages/GoogleAuthPage.jsx";
import { EditorRoomPage } from "../../features/editor/pages/EditorRoomPage.jsx";
import { RoomLobbyPage } from "../../features/rooms/pages/RoomLobbyPage.jsx";
import HomePage from "../../features/auth/pages/HomePage.jsx";
import HomeLobbyPage from "../../features/rooms/pages/HomeLobbyPage.jsx";
import JoinLobby from "../../features/rooms/pages/JoinLobby.jsx";

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
      // {index: true, element: <HomeLobbyPage/>},
      { index: true, element: <RoomLobbyPage /> },
      { path: "rooms/:roomCode", element: <EditorRoomPage /> },
    ],
  },

  
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
