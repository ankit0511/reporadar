import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import searchGitHubRepos, { buildGitHubQuery } from "../utils/githubSearch.js";

const router = express.Router();

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

if (!genAI) {
  console.warn("⚠️ GEMINI_API_KEY not set — /api/ai/query will fall back to plain keyword search");
}

function extractJson(text) {
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

// Gemini decides between three actions instead of blindly searching on every
// message: "search" when the request (plus saved preferences) has enough
// signal to run a meaningful GitHub query, "clarify" when it doesn't and a
// single follow-up question would get more useful results than guessing, or
// "chat" when the user isn't asking to find repos at all (greeting, thanks,
// a question about something already shown) and just wants a direct reply.
async function interpretQuery(query, preference, history) {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const historyBlock = history?.length
      ? `Recent conversation (oldest first):\n${history
          .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.text}`)
          .join("\n")}\n\n`
      : "";

    const prompt = `You are RepoRadar's assistant, helping a developer find open source GitHub repositories to contribute to.

${historyBlock}Their latest message: "${query}"
Their saved preferences — languages: ${preference?.language?.join(", ") || "none"}, topics: ${preference?.topic?.join(", ") || "none"}, experience: ${preference?.experience || "unknown"}.

Decide exactly one action:
- "search": the message (combined with their saved preferences if the message itself is thin) gives you enough to run a meaningful GitHub search — a language, topic, domain, project type, or experience hint.
- "clarify": the message is *about finding a project* but too vague to search meaningfully ("something cool", "help me find something", or any project request with no language/topic/domain hint and no usable saved preference to fall back on). Ask exactly one short, specific follow-up question instead of guessing.
- "chat": the message isn't asking you to find or search for repositories at all — greetings, thanks, small talk, or a question/follow-up about something already discussed in the conversation above. Just reply directly and conversationally. Never trigger a GitHub search for this action.

Reply with ONLY a JSON object, no markdown or code fences.

If action is "search", use this shape:
{
  "action": "search",
  "language": "single programming language mentioned or implied, or empty string",
  "topic": "single relevant GitHub topic slug (lowercase, hyphenated), or empty string",
  "experience": "one of beginner, intermediate, expert, or empty string",
  "keywords": "2-5 word search phrase capturing the core intent, or empty string",
  "explanation": "one short, friendly sentence (max 30 words) explaining the recommendation"
}

If action is "clarify", use this shape:
{
  "action": "clarify",
  "message": "one short, friendly follow-up question (max 25 words)"
}

If action is "chat", use this shape:
{
  "action": "chat",
  "message": "a direct, friendly conversational reply (max 40 words)"
}`;

    const result = await model.generateContent(prompt);
    return extractJson(result.response.text());
  } catch (error) {
    console.error("Gemini request failed:", error.message);
    return null;
  }
}

// POST /api/ai/query
router.post("/query", async (req, res) => {
  try {
    if (!req.user || !req.user.githubToken) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be logged in to ask the AI"
      });
    }

    const { query, history } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({
        error: "Missing query",
        message: "Tell the AI what kind of project you're looking for"
      });
    }

    // Only the last few turns are needed for conversational context — cap
    // it so the prompt stays small and older turns don't skew the intent.
    const trimmedHistory = Array.isArray(history) ? history.slice(-6) : [];

    const trimmedQuery = query.trim();
    const parsed = await interpretQuery(trimmedQuery, req.user.preference, trimmedHistory);

    // Plain conversation (greeting, thanks, follow-up) — reply directly,
    // no GitHub call this turn.
    if (parsed?.action === "chat") {
      return res.json({ type: "chat", message: parsed.message || "Got it!" });
    }

    // Too vague to search — ask exactly one follow-up question instead of
    // guessing, no GitHub call this turn.
    if (parsed?.action === "clarify") {
      return res.json({ type: "clarify", message: parsed.message || "Could you tell me a bit more about what you're looking for?" });
    }

    // "search" action, or Gemini unavailable/errored/returned bad JSON —
    // either way, fall back to a plain keyword search so the feature
    // degrades instead of breaking.
    const searchQuery = parsed?.action === "search"
      ? buildGitHubQuery(parsed.keywords || trimmedQuery, parsed.language, parsed.topic, null, parsed.experience)
      : buildGitHubQuery(trimmedQuery, null, null, null, null);

    const result = await searchGitHubRepos({
      query: searchQuery,
      token: req.user.githubToken,
      limit: 6
    });

    if (!result.success) {
      return res.status(result.status || 500).json({
        error: result.error || "Search failed",
        message: result.message || "Could not search repositories. Please try again."
      });
    }

    res.json({
      type: "result",
      explanation: parsed?.explanation || "Here are some repositories that match your request.",
      repositories: result.repositories
    });
  } catch (error) {
    console.error("AI query error:", error);
    res.status(500).json({
      error: "AI query failed",
      message: "Could not process that query. Please try again."
    });
  }
});

export default router;
