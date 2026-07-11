import express from "express";
import dotenv from "dotenv";
import repoRoute from "./routes/repos.js";
import preferenceRoute from "./routes/preference.js";
import connectDB from "./config/db.js";

const app = express();

dotenv.config();
connectDB();

app.use(express.json());

const port = process.env.PORT || 8000;

app.use("/api/repos", repoRoute);
app.use("/api/preference", preferenceRoute);

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Backend is running fine" });
});

app.listen(port, () => {
    console.log("App is running on port", port);
});