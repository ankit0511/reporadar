import express from "express";
import fetchAPI from "../utils/apiClient.js";

const router = express.Router();
const GITHUB_API_BASE = "https://api.github.com";

// Helper function to build GitHub search query
// Converts parameters into GitHub's search syntax
function buildGitHubQuery(language, topic, stars) {
  let query = "";

  if (language) {
    query += `language:${language} `;
  }

  if (topic) {
    query += `topic:${topic} `;
  }

  if (stars) {
    // stars >= 500 means "has 500 or more stars"
    query += `stars:>=${stars} `;
  }

  // Default: search only for repos with at least 100 stars (to avoid spam)
  if (!stars) {
    query += `stars:>=100 `;
  }

  return query.trim();
}

// GET /api/repos/search?language=python&topic=ml&stars=500&page=1&limit=10
router.get("/search", async (req, res) => {
  try {
    // Step 1: Extract query parameters
    const { language, topic, stars, page = 1, limit = 10 } = req.query;

    // Step 2: Check if user is authenticated
    if (!req.user || !req.user.githubToken) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "You must be logged in to search repositories"
      });
    }

    // Step 3: Build the GitHub search query
    const searchQuery = buildGitHubQuery(language, topic, stars);

    // Step 4: Calculate pagination (GitHub API starts at page 1)
    const githubPage = Math.max(1, Math.min(parseInt(page) || 1, 100)); // Max 100 pages
    const githubLimit = Math.min(parseInt(limit) || 10, 100); // Max 100 per page

    // Step 5: Use common API client to call GitHub API
    const result = await fetchAPI(`${GITHUB_API_BASE}/search/repositories`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${req.user.githubToken}`,
        Accept: "application/vnd.github.v3+json"
      },
      params: {
        q: searchQuery,
        sort: "stars",
        order: "desc",
        page: githubPage,
        per_page: githubLimit
      }
    });

    // Step 6: Handle API errors
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

    // Step 7: Transform GitHub data into our format
    const repos = result.data.items.map((repo) => ({
      id: repo.id,
      name: repo.name,
      owner: repo.owner.login,
      description: repo.description || "No description",
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language || "Unknown",
      topics: repo.topics || [],
      updated_at: repo.updated_at,
      created_at: repo.created_at
    }));

    // Step 8: Send response with metadata
    res.json({
      success: true,
      count: repos.length,
      total: result.data.total_count,
      page: githubPage,
      limit: githubLimit,
      repositories: repos
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