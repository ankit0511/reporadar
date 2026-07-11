import express from "express";
import User from "../models/User.js";

const router = express.Router();

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
      { new: true, upsert: true }
    );

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
    console.log("pref", preferences)
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