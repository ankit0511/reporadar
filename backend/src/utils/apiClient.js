// apiClient.js - Common wrapper for all external API calls
// Ensures consistent error handling, response format, and timeout across all requests
// Use this for GitHub API, Claude API, and any other external service

async function fetchAPI(url, options = {}) {
  const {
    method = "GET",
    headers = {},
    params = {},
    body = null,
    timeout = 10000 // 10 seconds default timeout
  } = options;

  try {
    // Step 1: Build URL with query parameters
    const urlObj = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        urlObj.searchParams.append(key, value);
      }
    });

    // Step 2: Prepare fetch options
    const fetchOptions = {
      method,
      headers: {
        "Accept": "application/json",
        ...headers
      }
    };

    // Step 3: Add body if present (for POST, PUT, etc.)
    if (body) {
      fetchOptions.body = JSON.stringify(body);
      fetchOptions.headers["Content-Type"] = "application/json";
    }

    // Step 4: Create timeout mechanism (if request takes too long, abort it)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    fetchOptions.signal = controller.signal;

    // Step 5: Make the actual fetch call
    const response = await fetch(urlObj.toString(), fetchOptions);

    // Clear timeout if request completes successfully
    clearTimeout(timeoutId);

    // Step 6: Handle non-2xx responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      const error = new Error(
        errorData.message || `API Error: ${response.status}`
      );
      error.status = response.status;
      error.data = errorData;

      throw error;
    }

    // Step 7: Parse and return successful response in consistent format
    const data = await response.json();

    return {
      success: true,
      status: response.status,
      data
    };

  } catch (error) {
    // Step 8: Handle different error types and return consistent error format
    if (error.name === "AbortError") {
      return {
        success: false,
        status: 408,
        error: "Request timeout",
        message: "API request took too long"
      };
    }

    return {
      success: false,
      status: error.status || 500,
      error: error.message,
      message: error.data?.message || "Failed to fetch from API"
    };
  }
}

export default fetchAPI;
