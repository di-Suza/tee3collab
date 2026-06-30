import Room from "./room.model.js";

class RoomRepository {
  async createRoom(roomData) {
    return await Room.create(roomData);
  }

  async findByCode(roomCode) {
    return await Room.findOne({ roomCode });
  }

  async findByCodeWithMembers(roomCode) {
    return await Room.findOne({ roomCode })
      .select("-password")
      .populate("createdBy", "name email picture")
      .populate("members", "name email picture");
  }

  async findHistoryByUser(userId) {
    return await Room.find({
      $or: [{ createdBy: userId }, { members: userId }],
    })
      .select("-password")
      .populate("createdBy", "name email picture")
      .populate("members", "name email picture")
      .sort({ updatedAt: -1 });
  }

  async addMember(roomId, userId) {
    return await Room.findByIdAndUpdate(
      roomId,
      { $addToSet: { members: userId } },
      { new: true },
    );
  }

  async closeRoom(roomId) {
    return await Room.findByIdAndUpdate(
      roomId,
      { status: "closed" },
      { new: true },
    ).select("-password");
  }
}

export { RoomRepository };
export default RoomRepository;
