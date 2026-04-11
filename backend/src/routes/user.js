import { express } from "express";
import User from "../models/User";
import router from "./repos";
import { set } from "mongoose";

const Router = express.Router();

router.post("/preference/:githubId", async (req, res) => {

    try {
        const githubId = req.params();
        const { language, topic, experience, hasContributed } = req.body();

        if (!language || !topic || !experience) {
            return res.status(400).json({
                error: "Sll three fields are mendetory",
                required: ["language. ", "experience", "topic"]
            })
        }

        const validLevel = ['beginer', 'intermediate', "expert"]

        if (!validLevel.includes(experience)) {
            return res.status(400).json({
                error: "Enter Valid Resource field"
            })
        }
        const user = User.findOneAndUpdate(
            { githubId },
            {
                $set: {
                    preferance: {
                        language,
                        topic,
                        experience,
                        hasContributed: hasContributed ?? false
                    },
                    onBoardingCompleate: true
                }
            },
            { new: true, upsert: true }
        )

        res.status(200).json({
            message: "Preferance Uploaded SuccessFully",
            preferance: user.preferance,
            onBoardingCompleate: user.onBoardingCompleate
        })
    } catch (error) {
        res.status(500).json({ error: "Server error", message: error.message });
    }
});


