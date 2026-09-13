import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized", message: "You must be logged in" });
  }
  next();
});

// githubId is public info, so the URL param alone proves nothing — every
// route here must only ever act on the logged-in user's own record.
router.param("githubId", (req, res, next, githubId) => {
  if (String(githubId) !== String(req.user.githubId)) {
    return res.status(403).json({
      error: "Forbidden",
      message: "You can only access your own preferences",
    });
  }
  next();
});

router.post("/:githubId", async (req, res) => {
  try {
    const { githubId } = req.params;
    const { language, topic, experience, hasContributed } = req.body;

    if (!language || !topic || !experience) {
      return res.status(400).json({
        error: "All three fields are mandatory",
        required: ["language", "experience", "topic"]
      });
    }

    const validLevel = ["beginner", "intermediate", "expert"];

    if (!validLevel.includes(experience)) {
      return res.status(400).json({
        error: "Enter valid experience level"
      });
    }

    const user = await User.findOneAndUpdate(
      { githubId },
      {
        $set: {
          preference: {
            language,
            topic,
            experience,
            hasContributed: hasContributed ?? false
          },
          onboardingCompleted: true
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "No user found" });
    }

    res.status(200).json({
      message: "Preference uploaded successfully",
      preference: user.preference,
      onboardingCompleted: user.onboardingCompleted
    });

  } catch (error) {
    res.status(500).json({ error: "Server error", message: error.message });
  }
});

router.get("/:githubId", async (req, res) => {
  try {
    const { githubId } = req.params;

    if (!githubId) {
      return res.status(400).json({
        error: "githubId is required",
        message: "githubId is required"
      });
    }

    const preferences = await User.findOne({ githubId });
    if (!preferences) {
      return res.status(404).json({
        error: "No user found",
        message: "No user with this githubId found"
      });
    }

    return res.status(200).json({
      message: "Preferences fetched successfully",
      language: preferences.preference.language,
      topic: preferences.preference.topic,
      experience: preferences.preference.experience
    });

  } catch (err) {
    return res.status(500).json({
      error: "Something went wrong while fetching preferences",
      message: err.message
    });
  }
});

router.get("/isOnBoarded/:githubId", async (req, res) => {
  try {
    const { githubId } = req.params;

    if (!githubId) {
      return res.status(400).json({
        error: "GitHub Id is required",
        message: "GitHub Id is required",
      });
    }

    const user = await User.findOne({ githubId });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        onboarding: false,
      });
    }

    if (user.onboardingCompleted) {
      return res.status(200).json({
        message: "User onboarding done",
        onboarding: true,
      });
    } else {
      return res.status(200).json({
        message: "Need to onboard User",
        onboarding: false,
      });
    }

  } catch (err) {
    return res.status(500).json({
      error: "Error getting user details",
      message: err.message,
    });
  }
});

export default router;