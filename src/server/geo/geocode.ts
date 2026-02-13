export interface GeocodeResult {
  lat: number;
  lon: number;
  city?: string;
  state?: string; // Standardized state code (e.g. MA)
}

/**
 * Simple in-memory cache for geocoding results for the demo.
 */
const geocodeCache = new Map<string, GeocodeResult>();

/**
 * Common state centroids for fallback.
 */
const stateCentroids: Record<string, { lat: number; lon: number }> = {
  "MA": { lat: 42.4072, lon: -71.3824 },
  "PA": { lat: 41.2033, lon: -77.1945 },
  "NY": { lat: 43.2994, lon: -74.2179 },
  "NJ": { lat: 40.0583, lon: -74.4057 },
  "NH": { lat: 43.1939, lon: -71.5724 },
  "RI": { lat: 41.6809, lon: -71.5118 },
  "DE": { lat: 38.9108, lon: -75.5277 },
};

/**
 * Geocodes an address string using OSM Nominatim.
 */
export async function geocodeLocation(city: string | null, state: string | null, locationText: string | null): Promise<GeocodeResult | null> {
  const queryParts = [locationText, city, state].filter(Boolean);
  if (queryParts.length === 0) return null;

  // Append USA to restrict results to domestic locations
  const query = queryParts.join(", ") + ", USA";
  
  // 1. Check Cache
  if (geocodeCache.has(query)) return geocodeCache.get(query)!;

  try {
    console.log(`[Geo] Geocoding query: ${query}`);
    
    // 2. OSM Nominatim (Fetch)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`,
      {
        headers: {
          "User-Agent": "BusVoicemailTriageMVP/1.0"
        }
      }
    );

    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const address = data[0].address;
      // Nominatim state codes are sometimes short, sometimes long.
      // We try to use a 2-letter code if possible.
      let resultState = address.state_code || state || null;
      
      // Map common long state names to codes if state_code is missing
      if (!resultState && address.state) {
          const stateLower = address.state.toLowerCase();
          if (stateLower === "massachusetts") resultState = "MA";
          if (stateLower === "pennsylvania") resultState = "PA";
          if (stateLower === "new jersey") resultState = "NJ";
          if (stateLower === "delaware") resultState = "DE";
          if (stateLower === "rhode island") resultState = "RI";
          if (stateLower === "new hampshire") resultState = "NH";
          if (stateLower === "new york") resultState = "NY";
      }

      const result: GeocodeResult = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        city: address.city || address.town || address.village || city || undefined,
        state: resultState || undefined
      };
      geocodeCache.set(query, result);
      return result;
    }

    // 3. Fallback to City, State if Location Text was too specific
    if (locationText && (city || state)) {
        console.log(`[Geo] Retrying without specific location text...`);
        return geocodeLocation(city, state, null);
    }

    // 4. Fallback to State Central Point
    if (state && stateCentroids[state.toUpperCase()]) {
        console.log(`[Geo] Fallback to state centroid for: ${state}`);
        return {
            ...stateCentroids[state.toUpperCase()],
            state: state.toUpperCase()
        };
    }

    return null;

  } catch (error) {
    console.warn(`[Geo] Nominatim failed:`, error);
    // Fallback on error too
     if (state && stateCentroids[state.toUpperCase()]) {
        return { ...stateCentroids[state.toUpperCase()], state: state.toUpperCase() };
    }
    return null;
  }
}
