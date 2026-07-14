// github.js - Small helpers for direct GitHub API checks that don't fit
// fetchAPI's JSON-response assumption (this endpoint returns an empty body).

// GitHub returns 204 if the authenticated user has starred owner/repo,
// 404 if not. No response body either way.
export async function isRepoStarred(token, owner, repo) {
  try {
    const response = await fetch(`https://api.github.com/user/starred/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json"
      }
    });
    return response.status === 204;
  } catch {
    return false;
  }
}

export default isRepoStarred;
