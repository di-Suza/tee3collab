import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentRoom: null,
  loading: false,
  error: null,
};

const roomsSlice = createSlice({
  name: "rooms",
  initialState,
  reducers: {
    setCurrentRoom(state, action) {
      state.currentRoom = action.payload;
      state.loading = false;
      state.error = null;
    },
    clearCurrentRoom(state) {
      state.currentRoom = null;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { setCurrentRoom, clearCurrentRoom, setLoading, setError } = roomsSlice.actions;
export default roomsSlice.reducer;
