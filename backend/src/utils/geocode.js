// geocode.js - Turns a free-text GitHub profile location ("Bangalore, India")
// into lat/lng coordinates so it can be plotted on the world map.
import fetchAPI from "./apiClient.js";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeLocation(location) {
  if (!location) return null;

  const result = await fetchAPI(NOMINATIM_URL, {
    method: "GET",
    headers: {
      // Nominatim's usage policy requires an identifiable User-Agent.
      "User-Agent": "RepoRadar-App",
    },
    params: { q: location, format: "json", limit: 1 },
  });

  if (!result.success || !Array.isArray(result.data) || result.data.length === 0) {
    return null;
  }

  const [match] = result.data;
  return { lat: parseFloat(match.lat), lng: parseFloat(match.lon) };
}

export default geocodeLocation;
