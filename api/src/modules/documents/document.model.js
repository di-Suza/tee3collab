import mongoose from "mongoose";

const patchHistorySchema = new mongoose.Schema(
  {
    version: {
      type: Number,
      required: true,
      min: 1,
    },
    baseVersion: {
      type: Number,
      required: true,
      min: 0,
    },
    position: {
      type: Number,
      required: true,
      min: 0,
    },
    deleteCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    insertTextLength: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientId: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    _id: false,
    timestamps: { createdAt: true, updatedAt: false },
  },
);

const documentSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      unique: true,
      index: true,
    },
    roomCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    content: {
      type: String,
      default: "",
    },
    version: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    patchHistory: {
      type: [patchHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const DocumentModel = mongoose.model("Document", documentSchema);

export { DocumentModel };
export default DocumentModel;
