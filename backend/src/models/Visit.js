import mongoose from "mongoose";

// One row per (user, repo) — repeat clicks bump visitCount/lastVisitedAt
// instead of piling up duplicate rows.
const visitSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    repoId: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    owner: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    language: {
        type: String,
        default: "Unknown"
    },
    stars: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["visited", "starred", "contributed", "not_interested"],
        default: "visited"
    },
    visitCount: {
        type: Number,
        default: 1
    },
    firstVisitedAt: {
        type: Date,
        default: Date.now
    },
    lastVisitedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

visitSchema.index({ userId: 1, repoId: 1 }, { unique: true });

const Visit = mongoose.model("Visit", visitSchema);
export default Visit;
