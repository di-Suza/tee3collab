class RoomSocketHandler {
  constructor(io, socket) {
    this.io = io;
    this.socket = socket;
  }

  register() {
    // Domain C will register room/presence socket events here.
  }
}

export { RoomSocketHandler };
export default RoomSocketHandler;
