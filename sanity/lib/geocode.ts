// Address → coordinates via OpenStreetMap's Nominatim geocoder. Runs in the
// Studio (the editor's browser); no API key needed. Nominatim allows about
// one request per second, so calls are spaced out.

export type GeocodeHit = { lat: number; lng: number; label: string };

const MIN_INTERVAL_MS = 1100;
let lastRequest = 0;

export async function geocode(query: string): Promise<GeocodeHit | null> {
  const wait = lastRequest + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequest = Date.now();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) throw new Error(`Nominatim answered ${res.status}`);
  const [hit] = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  if (!hit) return null;
  return { lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name };
}

/**
 * Looks a venue up by street address, then by name and city as a fallback
 * (for places the address search doesn't know).
 */
export async function geocodeVenue(venue: {
  name?: string;
  address?: string;
  postalCode?: string;
  city?: string;
}): Promise<GeocodeHit | null> {
  const address = [venue.address, [venue.postalCode, venue.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");
  const byAddress = venue.address ? await geocode(address) : null;
  if (byAddress) return byAddress;
  if (venue.name && venue.city) return geocode(`${venue.name}, ${venue.city}`);
  return null;
}
