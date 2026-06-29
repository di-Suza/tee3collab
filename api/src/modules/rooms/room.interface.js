class RoomInterface {
  static detail() {
    return {
      id: "ObjectId",
      roomCode: "string",
      status: "open | closed",
      createdBy: "User | ObjectId",
      members: "Array<User | ObjectId>",
      memberCount: "number",
      isHost: "boolean",
      role: "host | member",
      createdAt: "Date",
      updatedAt: "Date",
    };
  }

  static history() {
    return {
      createdRooms: "Array<RoomDetail>",
      joinedRooms: "Array<RoomDetail>",
    };
  }

  static inviteJoinRequest() {
    return {
      roomCode: "string",
      link: "string",
    };
  }
}

export { RoomInterface };
export default RoomInterface;
