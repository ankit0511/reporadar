import passport from "passport";
import GitHubStrategy from "passport-github2";
import User from "../models/User.js";

/**
 * Passport GitHub OAuth Configuration
 *
 * Flow:
 * 1. User clicks "Login with GitHub"
 * 2. Redirects to GitHub's authorize endpoint (handled by passport.authenticate("github"))
 * 3. User approves → GitHub redirects back to /api/auth/github/callback with a code
 * 4. Passport exchanges code for accessToken (server-to-server, invisible to user)
 * 5. verify() callback runs with the user's GitHub profile + accessToken
 * 6. We find-or-create the user in MongoDB with their token stored
 * 7. serializeUser() stores just their MongoDB _id in the session cookie
 * 8. On future requests, deserializeUser() looks up the full user from that _id
 * 9. req.user is now populated with the full user object for the entire request
 */

// Configure the GitHub strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || "http://localhost:5000/api/auth/github/callback",
    },
     
    // verify callback: runs after GitHub returns the user's profile
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find or create user in MongoDB
        // upsert: true means "create if doesn't exist"
        const user = await User.findOneAndUpdate(
          { githubId: profile.id },
          {
            $set: {
              githubId: profile.id,
              userName: profile.username,
              email: profile.emails?.[0]?.value || null,
              avatar: profile.photos?.[0]?.value || null,
              githubToken: accessToken, // Store the token so we can use it later for API calls
            },
          },
          { returnDocument: 'after', upsert: true }
        );

        // done(error, user) — tells Passport the authentication succeeded
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Serialize: decide what user data to store in the session
// We store only the MongoDB _id — keeps the session small and secure
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize: load the full user from the session's stored _id
// On every request, this runs to populate req.user
passport.deserializeUser(async (id, done) => {
  try {
    console.log("🔍 Deserializing user with ID:", id);
    const user = await User.findById(id);

    if (!user) {
      console.warn("⚠️ User not found in MongoDB for ID:", id);
      return done(null, null);
    }

    console.log("✓ User deserialized:", user.userName);
    done(null, user);
  } catch (error) {
    console.error("❌ Deserialization error:", error.message);
    done(error);
  }
});

export default passport;