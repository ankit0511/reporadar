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
    // Daily Gemini allowance. Each call costs real money, so usage is
    // capped per user per day. Stored as a (UTC date, count) pair rather
    // than a separate collection — there is only ever one row per user,
    // and it resets lazily on the first query of a new day.
    aiUsage: {
        date: { type: String, default: "" },
        count: { type: Number, default: 0 }
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