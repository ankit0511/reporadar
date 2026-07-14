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
    location: {
        type: String,
        default: null
    },
    profileUrl: {
        type: String,
        default: null
    },
    coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
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
    },
    // Capped, newest-first log of past searches — no per-item status to
    // track, so a plain sliced array is enough (unlike visits, which get
    // their own collection).
    recentSearches: {
        type: [
            {
                q: { type: String, default: "" },
                language: { type: String, default: "" },
                topic: { type: String, default: "" },
                experience: { type: String, default: "" },
                searchedAt: { type: Date, default: Date.now }
            }
        ],
        default: []
    }

}, { timestamps: true })

const User = mongoose.model("User", userSchema)
export default User