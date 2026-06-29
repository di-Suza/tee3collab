import Room from "./room.model.js";

class RoomRepository {
  async createRoom(roomData) {
    return await Room.create(roomData);
  }

  async findByCode(roomCode) {
    return await Room.findOne({ roomCode });
  }

  async addMember(roomId, userId) {
    return await Room.findByIdAndUpdate(
      roomId,
      { $addToSet: { members: userId } },
      { new: true },
    );
  }
}

export { RoomRepository };
export default RoomRepository;
