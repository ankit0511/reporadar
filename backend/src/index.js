import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// LOAD ENV VARS FIRST (before importing anything that uses them)
dotenv.config({ path: path.join(__dirname, "../.env") });

console.log("✓ Environment loaded");
console.log("✓ GitHub Client ID:", process.env.GITHUB_CLIENT_ID ? "✓ Set" : "✗ Missing");

// A guessable session secret lets anyone forge login cookies, so refuse to
// boot in production without a real one.
if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  console.error("FATAL: SESSION_SECRET must be set in production");
  process.exit(1);
}

// NOW dynamically import everything that depends on env vars
const express = (await import("express")).default;
const session = (await import("express-session")).default;
const MongoStore = (await import("connect-mongo")).default;
const cors = (await import("cors")).default;
const helmet = (await import("helmet")).default;
const rateLimit = (await import("express-rate-limit")).default;
const passport = (await import("./config/passport.js")).default;
const repoRoute = (await import("./routes/repos.js")).default;
const preferenceRoute = (await import("./routes/preference.js")).default;
const authRoute = (await import("./routes/auth.js")).default;
const activityRoute = (await import("./routes/activity.js")).default;
const aiRoute = (await import("./routes/ai.js")).default;
const chatHistoryRoute = (await import("./routes/chatHistory.js")).default;
const usersRoute = (await import("./routes/users.js")).default;
const connectDB = (await import("./config/db.js")).default;

const app = express();

// In production the app sits behind a hosting proxy (Render/Railway/Heroku/
// etc.); without this, Express sees plain HTTP and refuses to send the
// `secure` session cookie, silently breaking login.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

connectDB();

// Middleware order matters:
// 1. JSON parsing (so req.body works)
// 2. CORS (allow frontend requests from different origin)
// 3. Session (sets req.session for passport to use)
// 4. Passport (uses req.session to remember logged-in user)

app.use(helmet());

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
    // Persist sessions in Mongo instead of the default in-memory store, so
    // logins survive server restarts (e.g. nodemon reloading in dev) instead
    // of forcing everyone to log in again on every restart.
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_CONNECTION_STRING,
      dbName: "reporadar",
      collectionName: "sessions",
      ttl: 7 * 24 * 60 * 60, // 7 days, in seconds
    }),
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

// Rate limits: a general per-IP cap on the whole API, plus a much stricter
// one on /api/ai since each request costs real money (Gemini).
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests, please slow down" },
});

app.use("/api", apiLimiter);

// Routes
app.use("/api/auth", authRoute);
app.use("/api/repos", repoRoute);
app.use("/api/preference", preferenceRoute);
app.use("/api/activity", activityRoute);
app.use("/api/ai", aiLimiter, aiRoute);
app.use("/api/chat", chatHistoryRoute);
app.use("/api/users", usersRoute);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running fine" });
});

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log("App is running on port", port);
});