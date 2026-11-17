import { isUpcoming } from "@/lib/dates";
import type { EventCardData, EventStatus } from "@/sanity/lib/types";

export type LatLng = { lat: number; lng: number };

export type MapEvent = {
  id: string;
  title: string;
  slug: string;
  startsAt: string;
  status: EventStatus;
};

/** One marker on the map: a venue and its upcoming events, soonest first. */
export type MapVenue = LatLng & {
  id: string;
  name: string;
  address: string | null;
  events: MapEvent[];
};

/**
 * Groups upcoming, non-cancelled events by venue. Venues without
 * coordinates are left off the map.
 */
export function toMapVenues(events: EventCardData[], now = Date.now()): MapVenue[] {
  const byVenue = new Map<string, MapVenue>();

  for (const event of events) {
    const venue = event.venue;
    const lat = venue?.location?.lat;
    const lng = venue?.location?.lng;
    if (!venue || lat === undefined || lng === undefined) continue;
    if (event.status === "cancelled" || !isUpcoming(event.startsAt, now)) continue;

    let entry = byVenue.get(venue._id);
    if (!entry) {
      entry = {
        id: venue._id,
        name: venue.name ?? "Venue",
        address: [venue.address, venue.city].filter(Boolean).join(", ") || null,
        lat,
        lng,
        events: [],
      };
      byVenue.set(venue._id, entry);
    }
    entry.events.push({
      id: event._id,
      title: event.title ?? "Untitled",
      slug: event.slug,
      startsAt: event.startsAt,
      status: event.status,
    });
  }

  return [...byVenue.values()]
    .map((v) => ({ ...v, events: v.events.sort((a, b) => a.startsAt.localeCompare(b.startsAt)) }))
    .sort((a, b) => a.events[0].startsAt.localeCompare(b.events[0].startsAt));
}

/** Great-circle distance in metres (haversine). */
export function distanceInMetres(a: LatLng, b: LatLng) {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** "450 m", "3.2 km", "120 km" */
export function formatDistance(metres: number) {
  if (metres < 950) return `${Math.max(50, Math.round(metres / 50) * 50)} m`;
  const km = metres / 1000;
  return `${km < 100 ? km.toFixed(1) : Math.round(km)} km`;
}
