class RoomDTO {
  static detail(room, currentUserId = null) {
    if (!room) {
      return null;
    }

    const createdBy = room.createdBy;
    const createdById = createdBy?._id || createdBy;
    const isHost = currentUserId ? String(createdById) === String(currentUserId) : false;
    const members = Array.isArray(room.members) ? room.members : [];

    return {
      id: room._id,
      roomCode: room.roomCode,
      status: room.status,
      createdBy,
      members,
      memberCount: members.length,
      isHost,
      role: isHost ? "host" : "member",
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }

  static withJoinLink(room, joinLink, currentUserId = null) {
    return {
      room: RoomDTO.detail(room, currentUserId),
      roomCode: room.roomCode,
      joinLink,
    };
  }

  static history(rooms, currentUserId, buildJoinLink) {
    const createdRooms = [];
    const joinedRooms = [];

    for (const room of rooms) {
      const detail = {
        ...RoomDTO.detail(room, currentUserId),
        joinLink: buildJoinLink(room.roomCode),
      };

      if (detail.isHost) {
        createdRooms.push(detail);
      } else {
        joinedRooms.push(detail);
      }
    }

    return {
      createdRooms,
      joinedRooms,
    };
  }
}

export { RoomDTO };
export default RoomDTO;
