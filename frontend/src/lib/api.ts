// API utility functions for communicating with backend

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

interface FetchOptions extends RequestInit {
  params?: Record<string, any>;
}

export async function apiCall(
  endpoint: string,
  options: FetchOptions = {}
) {
  const { params, ...fetchOptions } = options;

  // Build URL with query params if provided
  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  // Default headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  try {
    const response = await fetch(url.toString(), {
      credentials: "include", // Include cookies for auth
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      const error = new Error(`API Error: ${response.status}`);
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error("API Call Error:", error);
    throw error;
  }
}

// Helper functions for common operations
export const api = {
  get: (endpoint: string, params?: Record<string, any>) =>
    apiCall(endpoint, { method: "GET", params }),

  post: (endpoint: string, body?: any, params?: Record<string, any>) =>
    apiCall(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      params,
    }),

  put: (endpoint: string, body?: any, params?: Record<string, any>) =>
    apiCall(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      params,
    }),

  patch: (endpoint: string, body?: any, params?: Record<string, any>) =>
    apiCall(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
      params,
    }),

  delete: (endpoint: string, params?: Record<string, any>) =>
    apiCall(endpoint, { method: "DELETE", params }),
};
