class RoomCodeUtil {
  static generate() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid ambiguous chars
    const length = 6;
    let code = "";
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export { RoomCodeUtil };
export default RoomCodeUtil;
