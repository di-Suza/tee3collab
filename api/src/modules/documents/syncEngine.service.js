import { AppError } from "../../shared/errors/AppError.js";
import { PatchUtil } from "../../shared/utils/patch.js";

class SyncEngineService {
  preparePatch(rawPatch, document) {
    const patch = PatchUtil.normalize(rawPatch);

    if (patch.baseVersion > document.version) {
      throw new AppError("Patch baseVersion is ahead of server version", 409, "PATCH_VERSION_AHEAD");
    }

    const transformedPatch = PatchUtil.transformAgainstHistory(patch, document.patchHistory);
    const wasTransformed = transformedPatch.transformedBy.length > 0;

    return {
      patch: transformedPatch,
      conflict: wasTransformed
        ? {
            type: "POSITION_SHIFT",
            reason: "Server accepted newer patches after this client's baseVersion, so the patch position was shifted before applying.",
            baseVersion: patch.baseVersion,
            serverVersion: document.version,
            transformedBy: transformedPatch.transformedBy,
          }
        : null,
    };
  }

  applyPatch(content, patch) {
    return PatchUtil.apply(content, patch);
  }
}

export { SyncEngineService };
export default SyncEngineService;
