import mongoose from "mongoose";

const CursorPositionSchema = new mongoose.Schema({
  user: { type: String, required: true }, // User ID or username
  position: { type: Object, required: true }, // Position in the document (e.g., Quill index)
});

const ChatMessageSchema = new mongoose.Schema({
  user: { type: String, required: true }, // User ID or username
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const DocumentSchema = new mongoose.Schema(
  {
    hash: { type: String, unique: true, required: true },
    content: { type: Object }, // Storing Quill Delta as JSON
    collaborators: [
      {
        user: { type: String, required: true }, // User ID
        permission: {
          type: String,
          enum: ["read", "edit", "admin"],
          required: true,
        },
      },
    ],
    cursorPositions: [CursorPositionSchema], // Track user cursor positions
    chat: [ChatMessageSchema], // Embed chat messages
  },
  { timestamps: true },
);

export default mongoose.model("Document", DocumentSchema);
