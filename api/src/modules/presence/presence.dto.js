class PresenceDTO {
  static actor(user, role = "member") {
    const id = String(user?._id || user?.id || user || "");

    return {
      id,
      name: user?.name || "Unknown user",
      email: user?.email || null,
      picture: user?.picture || null,
      role,
    };
  }

  static participant(entry) {
    const connectionCount = entry.sockets.size;

    return {
      ...entry.user,
      status: connectionCount > 0 ? "online" : "offline",
      connectionCount,
      joinedAt: entry.joinedAt,
      lastSeenAt: entry.lastSeenAt,
    };
  }

  static room(roomCode, participants) {
    const onlineCount = participants.filter(
      (participant) => participant.status === "online",
    ).length;

    return {
      roomCode,
      participants,
      onlineCount,
      totalCount: participants.length,
      updatedAt: new Date().toISOString(),
    };
  }
}

export { PresenceDTO };
export default PresenceDTO;
