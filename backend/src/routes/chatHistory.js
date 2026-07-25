import express from "express";
import ChatMessage from "../models/ChatMessage.js";

const router = express.Router();

// Cap how much history a single load/context window has to carry.
const HISTORY_LIMIT = 50;

router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized", message: "You must be logged in" });
  }
  next();
});

// The frontend's ChatMessage type keys messages by a numeric `id` — reuse
// the timestamp instead of exposing Mongo's ObjectId.
function toClientShape(doc) {
  return {
    id: doc.createdAt.getTime(),
    role: doc.role,
    text: doc.text,
    repositories: doc.repositories,
    time: doc.createdAt.toISOString(),
  };
}

// GET /api/chat — full conversation, oldest first
router.get("/", async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(HISTORY_LIMIT);

    res.status(200).json({ messages: messages.reverse().map(toClientShape) });
  } catch (error) {
    res.status(500).json({ error: "Failed to load chat history", message: error.message });
  }
});

// POST /api/chat — persist one turn (user message or assistant reply)
router.post("/", async (req, res) => {
  try {
    const { role, text, repositories } = req.body;

    if (!role || !text) {
      return res.status(400).json({ error: "Missing fields", message: "role and text are required" });
    }

    const doc = await ChatMessage.create({ userId: req.user._id, role, text, repositories });
    res.status(201).json({ message: toClientShape(doc) });
  } catch (error) {
    res.status(500).json({ error: "Failed to save message", message: error.message });
  }
});

// DELETE /api/chat — wipe the conversation ("New chat")
router.delete("/", async (req, res) => {
  try {
    await ChatMessage.deleteMany({ userId: req.user._id });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear chat history", message: error.message });
  }
});

export default router;
