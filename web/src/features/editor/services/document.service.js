import { httpClient } from "../../../shared/api/http-client.js";

export class DocumentService {
  static async getDocument(roomCode) {
    const { data } = await httpClient.get(`/documents/${roomCode}`);
    return data.data;
  }

  static async applyPatch(roomCode, patch) {
    const { data } = await httpClient.patch(`/documents/${roomCode}/patch`, patch);
    return data.data;
  }
}
