import { DocumentService } from "./document.service.js";

class DocumentController {
  constructor(documentService) {
    this.documentService = documentService || new DocumentService();
  }

  async getSnapshot(req, res, next) {
    try {
      const snapshot = await this.documentService.getSnapshot(req.params.roomCode);

      return res.json({
        success: true,
        data: snapshot,
      });
    } catch (error) {
      return next(error);
    }
  }

  async applyPatch(req, res, next) {
    try {
      const result = await this.documentService.applyPatch(
        req.params.roomCode,
        req.body,
        req.user,
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

export { DocumentController };
export default DocumentController;
