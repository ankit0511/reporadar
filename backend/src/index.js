import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// LOAD ENV VARS FIRST (before importing anything that uses them)
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("✓ Environment loaded");
console.log("✓ GitHub Client ID:", process.env.GITHUB_CLIENT_ID ? "✓ Set" : "✗ Missing");

// NOW dynamically import everything that depends on env vars
const express = (await import("express")).default;
const session = (await import("express-session")).default;
const cors = (await import("cors")).default;
const passport = (await import("./config/passport.js")).default;
const repoRoute = (await import("./routes/repos.js")).default;
const preferenceRoute = (await import("./routes/preference.js")).default;
const authRoute = (await import("./routes/auth.js")).default;
const connectDB = (await import("./config/db.js")).default;

const app = express();

connectDB();

// Middleware order matters:
// 1. JSON parsing (so req.body works)
// 2. CORS (allow frontend requests from different origin)
// 3. Session (sets req.session for passport to use)
// 4. Passport (uses req.session to remember logged-in user)

app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // Allow cookies/session to be sent with requests
  })
);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false, // Don't save session if nothing changed
    saveUninitialized: false, // Don't create empty sessions
    cookie: {
      httpOnly: true, // Can't be accessed by JavaScript, only HTTP requests
      secure: process.env.NODE_ENV === "production", // Only HTTPS in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// Passport middleware: initializes passport and attaches req.user
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoute);
app.use("/api/repos", repoRoute);
app.use("/api/preference", preferenceRoute);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running fine" });
});

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log("App is running on port", port);
});