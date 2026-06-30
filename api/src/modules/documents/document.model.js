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

const lineAuthorSchema = new mongoose.Schema(
  {
    lineNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    actorId: {
      type: String,
      required: true,
      trim: true,
    },
    actorName: {
      type: String,
      trim: true,
      default: "Someone",
    },
    actorPicture: {
      type: String,
      trim: true,
      default: null,
    },
    version: {
      type: Number,
      required: true,
      min: 1,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

const conflictMarkerSchema = new mongoose.Schema(
  {
    lineNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      trim: true,
      default: "POSITION_SHIFT",
    },
    actorId: {
      type: String,
      trim: true,
      default: null,
    },
    actorName: {
      type: String,
      trim: true,
      default: "Someone",
    },
    version: {
      type: Number,
      required: true,
      min: 1,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
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
    lineAuthors: {
      type: [lineAuthorSchema],
      default: [],
    },
    conflictMarkers: {
      type: [conflictMarkerSchema],
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
