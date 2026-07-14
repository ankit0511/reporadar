import express from "express";
import User from "../models/User.js";
import searchGitHubRepos, { buildGitHubQuery } from "../utils/githubSearch.js";

const router = express.Router();

// GET /api/repos/search?q=chatbot&language=python&topic=ml&stars=500&page=1&limit=10
router.get("/search", async (req, res) => {
  try {
    // Step 1: Extract query parameters
    const { q: keyword, language, topic, stars, experience, page = 1, limit = 10 } = req.query;

    // Step 2: Check if user is authenticated
    if (!req.user || !req.user.githubToken) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be logged in to search repositories"
      });
    }

    if (!keyword && !language && !topic && !experience) {
      return res.status(400).json({
        error: "Missing search criteria",
        message: "Provide at least a keyword, language, topic, or experience level to search"
      });
    }

    // Step 3: Build the GitHub search query
    const searchQuery = buildGitHubQuery(keyword, language, topic, stars, experience);

    // Step 4-7: Search GitHub and transform the results
    const result = await searchGitHubRepos({
      query: searchQuery,
      token: req.user.githubToken,
      page,
      limit
    });

    // Handle API errors
    if (!result.success) {
      if (result.status === 422) {
        return res.status(400).json({
          error: "Invalid search query",
          message: result.message
        });
      }

      if (result.status === 403) {
        return res.status(403).json({
          error: "Rate limited",
          message: result.message
        });
      }

      return res.status(result.status || 500).json({
        error: result.error,
        message: result.message
      });
    }

    // Step 8: Log the search to the user's recent-searches history.
    // Best-effort — a logging hiccup must never fail the actual search.
    try {
      await User.findByIdAndUpdate(req.user._id, {
        $push: {
          recentSearches: {
            $each: [{
              q: keyword || "",
              language: language || "",
              topic: topic || "",
              experience: experience || ""
            }],
            $position: 0,
            $slice: 10
          }
        }
      });
    } catch (logError) {
      console.error("Failed to log recent search:", logError.message);
    }

    // Step 9: Send response with metadata
    res.json({
      success: true,
      count: result.repositories.length,
      total: result.total,
      page: result.page,
      limit: result.limit,
      repositories: result.repositories
    });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      error: "Search failed",
      message: "Could not search repositories. Please try again."
    });
  }
});

export default router;