import express from "express";
import passport from "passport";

const router = express.Router();

/**
 * GitHub OAuth Routes
 *
 * Endpoints:
 * - GET /api/auth/github → Start OAuth flow, redirect to GitHub
 * - GET /api/auth/github/callback → GitHub redirects here after user approves
 * - GET /api/auth/me → Get current logged-in user (or null if not logged in)
 * - POST /api/auth/logout → Clear session, log out
 */

// Step 1: Initiate OAuth flow
// When user clicks "Login with GitHub", redirect to this endpoint
// Passport redirects to GitHub's authorize URL with our client_id
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));

// Step 2: GitHub OAuth callback
// GitHub redirects the browser back here with a ?code parameter
// Passport automatically:
// 1. Exchanges the code for an accessToken
// 2. Calls the verify() callback in passport.js
// 3. Creates a session via serializeUser()
// Then we redirect to the frontend's dashboard
router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/" }),
  (req, res) => {
    // Authentication successful, session is set.
    // Land back on the home page — it opens the onboarding dialog for
    // first-time users before ever sending them to the dashboard.
    res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/`);
  }
);

// Get current logged-in user
// Returns the user object from req.user (populated by passport.session())
// Returns null if not logged in
router.get("/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ user: null });
  }

  res.json({
    user: {
      id: req.user._id,
      githubId: req.user.githubId,
      userName: req.user.userName,
      email: req.user.email,
      avatar: req.user.avatar,
      location: req.user.location,
      coordinates: req.user.coordinates,
      profileUrl: req.user.profileUrl,
      onboardingCompleted: req.user.onboardingCompleted,
      preference: req.user.preference,
    },
  });
});

// Logout: destroy the session
// This clears the session cookie and req.user on the next request
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to logout", message: err.message });
    }

    res.json({ message: "Logged out successfully" });
  });
});

export default router;
