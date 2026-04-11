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

export default router;