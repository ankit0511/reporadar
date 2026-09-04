import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import searchGitHubRepos, { buildGitHubQuery } from "../utils/githubSearch.js";

const router = express.Router();

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Google retires model versions over time (gemini-2.0-flash 404s now) —
// keep the name in env so the next deprecation is a config change.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

if (!genAI) {
  console.warn("⚠️ GEMINI_API_KEY not set — /api/ai/query will fall back to plain keyword search");
}

// Gemini's free tier enforces a low requests-per-minute quota. Once we hit a
// 429, retrying on the very next message just trips it again and floods the
// logs — so back off for a bit and go straight to keyword search until the
// cooldown clears.
const RATE_LIMIT_COOLDOWN_MS = 60_000;
let geminiCooldownUntil = 0;

// When Gemini is unreachable (down, rate-limited, bad JSON), `interpretQuery`
// returns null and the code falls back to a plain GitHub keyword search —
// which turns a stray "hii" or "thanks" into a literal search for repos
// named "hii". Catch the obvious greetings/small talk locally first so those
// still get a friendly reply instead of nonsense search results.
const THANKS_PATTERN = /^(thanks?|thank\s?you|ty|thx|cheers)[!.,\s]*$/i;
const GREETING_PATTERN = /^(h+e?y+a?|h+i+|h+e+l+l+o+|yo+|sup|good\s?(morning|afternoon|evening)|ok(ay)?|cool|nice|great|awesome)[!.,\s]*$/i;

function localSmallTalkReply(query) {
  const normalized = query.trim();
  if (THANKS_PATTERN.test(normalized)) {
    return "You're welcome! Let me know if you'd like more repo recommendations.";
  }
  if (GREETING_PATTERN.test(normalized)) {
    return "Hey! Tell me a language, topic, or the kind of project you'd like to contribute to, and I'll find some repos for you.";
  }
  return null;
}

// Fixed refusal for anything outside RepoRadar's domain (general knowledge,
// news, math, homework...). The model only *classifies* a message as
// out_of_scope — the wording of the refusal is ours, so the boundary reply
// stays consistent and never leaks a general-knowledge answer.
const OUT_OF_SCOPE_MESSAGE =
  "That's outside my scope — I can only help you find open source repositories to contribute to, and answer questions about your RepoRadar profile and activity.";

// "who am i" style answers are built entirely from the user's DB record.
// The model never writes profile facts, so it can't invent any.
function buildProfileReply(user) {
  const pref = user.preference || {};

  let reply = `You're ${user.userName} (GitHub ID: ${user.githubId})`;
  if (user.location) reply += `, based in ${user.location}`;
  reply += ".";

  const interests = [];
  if (pref.language?.length) interests.push(`languages: ${pref.language.join(", ")}`);
  if (pref.topic?.length) interests.push(`topics: ${pref.topic.join(", ")}`);
  if (pref.experience) interests.push(`experience level: ${pref.experience}`);

  reply += interests.length
    ? ` Your saved preferences — ${interests.join(" · ")}.`
    : " You haven't saved any preferences yet — set them up so I can tailor recommendations for you.";

  if (user.profileUrl) reply += ` GitHub profile: ${user.profileUrl}`;
  return reply;
}

function extractJson(text) {
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

// Gemini decides between five actions instead of blindly searching on every
// message: "search" when the request (plus saved preferences) has enough
// signal to run a meaningful GitHub query, "clarify" when it doesn't and a
// single follow-up question would get more useful results than guessing,
// "profile" when the user asks about their own account (the route answers
// from the DB — Gemini never writes profile facts), "out_of_scope" for
// anything unrelated to RepoRadar's domain (the route returns a fixed
// refusal), or "chat" for greetings/thanks/follow-ups about the conversation.
async function interpretQuery(query, preference, history) {
  if (!genAI) return null;
  if (Date.now() < geminiCooldownUntil) return null;

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const historyBlock = history?.length
      ? `Recent conversation (oldest first):\n${history
          .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.text}`)
          .join("\n")}\n\n`
      : "";

    const prompt = `You are RepoRadar's assistant, helping a developer find open source GitHub repositories to contribute to.

${historyBlock}Their latest message: "${query}"
Their saved preferences — languages: ${preference?.language?.join(", ") || "none"}, topics: ${preference?.topic?.join(", ") || "none"}, experience: ${preference?.experience || "unknown"}.

YOUR SCOPE IS STRICT. You only handle two subjects: (1) finding open source GitHub repositories to contribute to, and (2) the user's own RepoRadar account — their identity, preferences, and activity. Everything else is out of scope, even if you know the answer.

Decide exactly one action:
- "search": the message (combined with their saved preferences if the message itself is thin) gives you enough to run a meaningful GitHub search — a language, topic, domain, project type, or experience hint.
- "clarify": the message is *about finding a project* but too vague to search meaningfully ("something cool", "help me find something", or any project request with no language/topic/domain hint and no usable saved preference to fall back on). Ask exactly one short, specific follow-up question instead of guessing.
- "profile": the user asks about THEMSELVES or their account — who they are, their GitHub username, their saved languages/topics/experience level. Never answer profile questions yourself; the app answers them from its database.
- "out_of_scope": ANY question or request outside the two subjects above — general knowledge (people, places, history, news), math, weather, jokes, poems, essays, translations, code debugging, career advice, anything else. Never answer it, even partially. Choose this even when you know the answer.
- "chat": greetings, thanks, small talk, or a question/follow-up about repositories already discussed in the conversation above. Just reply directly and conversationally. Never trigger a GitHub search for this action.

Examples of correct routing:
- "who am i" -> {"action": "profile"}
- "what are my saved languages?" -> {"action": "profile"}
- "who is barack obama" -> {"action": "out_of_scope"}
- "what is 25 * 4" -> {"action": "out_of_scope"}
- "write me a poem about the sea" -> {"action": "out_of_scope"}
- "fix this python error for me" -> {"action": "out_of_scope"}
- "find me beginner react projects" -> {"action": "search", ...}
- "suggest something cool" (no saved preferences) -> {"action": "clarify", ...}
- "thanks!" -> {"action": "chat", ...}

Reply with ONLY a JSON object, no markdown or code fences.

If action is "profile" or "out_of_scope", use this shape (no other fields):
{
  "action": "profile" or "out_of_scope"
}

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
    if (error.status === 429) {
      geminiCooldownUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
      console.warn(`Gemini rate limit (429) hit — falling back to keyword search for ${RATE_LIMIT_COOLDOWN_MS / 1000}s`);
    } else {
      console.error("Gemini request failed:", error.message);
    }
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

    // "Who am I?" — answered entirely from the DB record, never by the
    // model, so the facts are always real.
    if (parsed?.action === "profile") {
      return res.json({ type: "chat", message: buildProfileReply(req.user) });
    }

    // Off-topic question — fixed refusal, no model-written answer.
    if (parsed?.action === "out_of_scope") {
      return res.json({ type: "chat", message: OUT_OF_SCOPE_MESSAGE });
    }

    // Gemini didn't classify this turn at all (down, rate-limited, bad JSON)
    // — catch profile questions and obvious small talk locally before
    // defaulting to a search.
    if (!parsed) {
      if (/^(who\s*am\s*i|what('?s| is| are) my (name|profile|preferences?))\??[!.\s]*$/i.test(trimmedQuery)) {
        return res.json({ type: "chat", message: buildProfileReply(req.user) });
      }
      const smallTalk = localSmallTalkReply(trimmedQuery);
      if (smallTalk) {
        return res.json({ type: "chat", message: smallTalk });
      }
    }

    // Scope enforced in code, not just in the prompt: if Gemini returned an
    // action we don't recognize, refuse rather than letting the message leak
    // through to a GitHub search (or worse, a free-form answer).
    if (parsed && parsed.action !== "search") {
      return res.json({ type: "chat", message: OUT_OF_SCOPE_MESSAGE });
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
