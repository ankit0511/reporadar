import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    githubId: {
        type: String,
        required: true,
        unique: true,
    },
    userName: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String
    },
    avatar: {
        type: String
    },
    githubToken: {
        type: String,
        required: true
    },
    preference: {
        language: {
            type: [String],
            default: []
        },
        topic: {
            type: [String],
            default: []
        },
        experience: {
            type: String,
            default: ""
        },
        hasContributed: {
            type: Boolean,
            default: false
        }
    },
    onboardingCompleted: {
        type: Boolean,
        default: false
    }

}, { timestamps: true })

const User = mongoose.model("User", userSchema)
export default User