import fetchAPI from "./apiClient.js";

const GITHUB_API_BASE = "https://api.github.com";

// "Experience" isn't free text — it maps to GitHub's real repo-search
// qualifiers for how approachable a project's open issues are.
export const EXPERIENCE_QUALIFIERS = {
  beginner: "good-first-issues:>0",
  intermediate: "help-wanted-issues:>0",
  expert: null
};

// Converts structured filters into GitHub's search syntax. Shared by
// routes/repos.js (structured search) and routes/ai.js (Gemini-parsed
// natural language query).
export function buildGitHubQuery(keyword, language, topic, stars, experience) {
  let query = "";

  if (keyword) {
    query += `${keyword} `;
  }

  if (language) {
    query += `language:${language} `;
  }

  if (topic) {
    query += `topic:${topic} `;
  }

  const experienceQualifier = EXPERIENCE_QUALIFIERS[experience];
  if (experienceQualifier) {
    query += `${experienceQualifier} `;
  }

  if (stars) {
    query += `stars:>=${stars} `;
  }

  // Default: search only for repos with at least 100 stars (to avoid spam)
  if (!stars) {
    query += `stars:>=100 `;
  }

  return query.trim();
}

// Shared by routes/repos.js (structured search) and routes/ai.js (natural
// language query) so both stay in sync on the GitHub call + response shape.
export async function searchGitHubRepos({ query, token, page = 1, limit = 10 }) {
  const githubPage = Math.max(1, Math.min(parseInt(page) || 1, 100));
  const githubLimit = Math.min(parseInt(limit) || 10, 100);

  const result = await fetchAPI(`${GITHUB_API_BASE}/search/repositories`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json"
    },
    params: {
      q: query,
      sort: "stars",
      order: "desc",
      page: githubPage,
      per_page: githubLimit
    }
  });

  if (!result.success) {
    return { success: false, status: result.status, error: result.error, message: result.message };
  }

  const repositories = result.data.items.map((repo) => ({
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

  return {
    success: true,
    repositories,
    total: result.data.total_count,
    page: githubPage,
    limit: githubLimit
  };
}

export default searchGitHubRepos;
