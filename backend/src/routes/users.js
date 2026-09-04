import express from "express";
import User from "../models/User.js";

const router = express.Router();

// GET /api/users/locations — powers the landing page's "Developers
// Everywhere" world map, so it's public (the landing page renders before
// login). Only exposes the minimum the map needs (name, avatar, city,
// coordinates — never email or tokens), only for users whose GitHub
// location geocoded successfully, capped so the payload stays small.
router.get("/locations", async (req, res) => {
  try {
    const users = await User.find(
      { "coordinates.lat": { $ne: null }, "coordinates.lng": { $ne: null } },
      { userName: 1, avatar: 1, location: 1, coordinates: 1 }
    )
      .sort({ updatedAt: -1 })
      .limit(50);

    res.status(200).json({
      users: users.map((u) => ({
        id: u._id.toString(),
        userName: u.userName,
        avatar: u.avatar,
        location: u.location,
        lat: u.coordinates.lat,
        lng: u.coordinates.lng,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load user locations", message: error.message });
  }
});

// GET /api/users/stats — real social proof for the landing hero: the actual
// registered-user count plus a few real avatars. Public, minimal fields.
router.get("/stats", async (req, res) => {
  try {
    const [totalUsers, recent] = await Promise.all([
      User.countDocuments(),
      User.find({ avatar: { $nin: [null, ""] } }, { avatar: 1 })
        .sort({ createdAt: -1 })
        .limit(4),
    ]);

    res.status(200).json({
      totalUsers,
      avatars: recent.map((u) => u.avatar),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to load user stats", message: error.message });
  }
});

export default router;
