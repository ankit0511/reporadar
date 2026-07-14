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

// Gemini decides between two actions instead of blindly searching on every
// message: "search" when the request (plus saved preferences) has enough
// signal to run a meaningful GitHub query, or "clarify" when it doesn't and
// a single follow-up question would get more useful results than guessing.
async function interpretQuery(query, preference) {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are RepoRadar's assistant, helping a developer find open source GitHub repositories to contribute to.

Their message: "${query}"
Their saved preferences — languages: ${preference?.language?.join(", ") || "none"}, topics: ${preference?.topic?.join(", ") || "none"}, experience: ${preference?.experience || "unknown"}.

Decide exactly one action:
- "search": the message (combined with their saved preferences if the message itself is thin) gives you enough to run a meaningful GitHub search — a language, topic, domain, project type, or experience hint.
- "clarify": the message is too vague to search meaningfully (a greeting, "something cool", "help me", or any request with no language/topic/domain hint and no usable saved preference to fall back on). Ask exactly one short, specific follow-up question instead of guessing.

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

    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({
        error: "Missing query",
        message: "Tell the AI what kind of project you're looking for"
      });
    }

    const trimmedQuery = query.trim();
    const parsed = await interpretQuery(trimmedQuery, req.user.preference);

    // Gemini asked for more detail instead of guessing — surface the
    // question and stop here, no GitHub call this turn.
    if (parsed?.action === "clarify" && parsed.message) {
      return res.json({ type: "clarify", message: parsed.message });
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
