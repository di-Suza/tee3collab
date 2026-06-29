import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice.js";
import roomsReducer from "../features/rooms/roomsSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rooms: roomsReducer,
  },
});

export default store;
