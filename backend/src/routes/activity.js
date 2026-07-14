import express from "express";
import Visit from "../models/Visit.js";
import isRepoStarred from "../utils/github.js";

const router = express.Router();

const VALID_STATUSES = ["visited", "starred", "contributed", "not_interested"];

router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized", message: "You must be logged in" });
  }
  next();
});

// POST /api/activity/visit — logged on every repo card click.
// Upserts by (userId, repoId): repeat clicks just bump the counter.
router.post("/visit", async (req, res) => {
  try {
    const { repoId, name, owner, url, language, stars } = req.body;

    if (!repoId || !name || !owner || !url) {
      return res.status(400).json({
        error: "Missing repo details",
        message: "repoId, name, owner, and url are required"
      });
    }

    const now = new Date();
    const visit = await Visit.findOneAndUpdate(
      { userId: req.user._id, repoId },
      {
        $set: { name, owner, url, language, stars, lastVisitedAt: now },
        $setOnInsert: { status: "visited", firstVisitedAt: now },
        $inc: { visitCount: 1 }
      },
      { new: true, upsert: true }
    );

    // Best-effort: if GitHub already shows this repo as starred and the
    // user hasn't self-reported anything more specific, reflect that
    // automatically instead of waiting on them to tell us.
    if (visit.status === "visited") {
      const starred = await isRepoStarred(req.user.githubToken, owner, name);
      if (starred) {
        visit.status = "starred";
        await visit.save();
      }
    }

    res.status(200).json({ visit });
  } catch (error) {
    res.status(500).json({ error: "Failed to log visit", message: error.message });
  }
});

// PATCH /api/activity/visit/:repoId — self-reported status.
router.patch("/visit/:repoId", async (req, res) => {
  try {
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: "Invalid status",
        message: `status must be one of: ${VALID_STATUSES.join(", ")}`
      });
    }

    const visit = await Visit.findOneAndUpdate(
      { userId: req.user._id, repoId: Number(req.params.repoId) },
      { $set: { status } },
      { new: true }
    );

    if (!visit) {
      return res.status(404).json({ error: "Visit not found" });
    }

    res.status(200).json({ visit });
  } catch (error) {
    res.status(500).json({ error: "Failed to update status", message: error.message });
  }
});

// GET /api/activity/recent-visits
router.get("/recent-visits", async (req, res) => {
  try {
    const visits = await Visit.find({ userId: req.user._id })
      .sort({ lastVisitedAt: -1 })
      .limit(20);

    res.status(200).json({ visits });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch visits", message: error.message });
  }
});

// GET /api/activity/recent-searches
router.get("/recent-searches", async (req, res) => {
  res.status(200).json({ searches: req.user.recentSearches ?? [] });
});

export default router;
