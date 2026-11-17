// Reads public Eventbrite pages and maps their schema.org Event data (JSON-LD)
// onto the fields of our `event` document. No Eventbrite API token needed.
//
// Accepted links:
//   organizer: https://www.eventbrite.de/o/riff-city-121190972731
//   event:     https://www.eventbrite.de/e/some-show-tickets-2002327794334
//
// This is scraping: if Eventbrite changes its markup, only this file should
// need to change.

export type EventbriteStatus = "onSale" | "free" | "soldOut" | "cancelled";

export type EventbriteVenue = {
  name: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
};

export type EventbriteEvent = {
  eventbriteId: string;
  url: string;
  title: string;
  description?: string;
  /** UTC ISO string, ready for the `startsAt` datetime field. */
  startsAt: string;
  endsAt?: string;
  status: EventbriteStatus;
  /** Free text for the `price` field, e.g. "€6.50–€13.00". */
  price?: string;
  venue?: EventbriteVenue;
  lineup: string[];
  imageUrl?: string;
};

export type EventbriteLink =
  | { kind: "organizer"; url: string }
  | { kind: "event"; id: string; origin: string };

/** Hard cap so one organizer link can't trigger an unbounded number of fetches. */
export const MAX_EVENTS = 50;

const FETCH_CONCURRENCY = 4;
const FETCH_TIMEOUT_MS = 10_000;

// Matches eventbrite.com, eventbrite.de, eventbrite.co.uk, … (and www.)
const HOST_RE = /^(www\.)?eventbrite\.[a-z]{2,3}(\.[a-z]{2})?$/i;
const EVENT_ID_RE = /-tickets-(\d{6,})/;
// Event links inside an organizer page: /e/<slug>-tickets-<id>
const EVENT_LINK_RE = /\/e\/[a-z0-9-]*?-tickets-(\d{6,})/gi;

export class EventbriteError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Validates that the link points at Eventbrite (so the server route can't be
 * used as an open proxy) and works out whether it is an organizer or an event.
 */
export function parseEventbriteLink(input: string): EventbriteLink {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new EventbriteError("That doesn't look like a link.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new EventbriteError("Only http(s) links are supported.");
  }
  if (!HOST_RE.test(url.hostname)) {
    throw new EventbriteError("Please paste an eventbrite link.");
  }
  const origin = `https://${url.hostname}`;
  const [section] = url.pathname.split("/").filter(Boolean);

  if (section === "o") {
    return { kind: "organizer", url: `${origin}${url.pathname}` };
  }
  if (section === "e") {
    const id = url.pathname.match(EVENT_ID_RE)?.[1] ?? url.pathname.match(/\/e\/(\d{6,})/)?.[1];
    if (id) return { kind: "event", id, origin };
  }
  throw new EventbriteError(
    "Use an organizer link (…/o/…) or an event link (…/e/…)."
  );
}

/** Resolves a link to its events (sorted by start time) plus per-event errors. */
export async function fetchEventbriteEvents(input: string): Promise<{
  events: EventbriteEvent[];
  errors: { eventbriteId: string; message: string }[];
}> {
  const link = parseEventbriteLink(input);

  const ids =
    link.kind === "event" ? [link.id] : await fetchOrganizerEventIds(link.url);
  const origin = link.kind === "event" ? link.origin : new URL(link.url).origin;

  const results = await mapWithConcurrency(ids, FETCH_CONCURRENCY, async (id) => {
    try {
      return { ok: true as const, event: await fetchEvent(origin, id) };
    } catch (err) {
      return {
        ok: false as const,
        error: { eventbriteId: id, message: (err as Error).message },
      };
    }
  });

  const events = results
    .flatMap((r) => (r.ok ? [r.event] : []))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const errors = results.flatMap((r) => (r.ok ? [] : [r.error]));
  return { events, errors };
}

async function fetchOrganizerEventIds(url: string): Promise<string[]> {
  const html = await fetchHtml(url);
  const ids = new Set<string>();
  for (const match of html.matchAll(EVENT_LINK_RE)) {
    ids.add(match[1]);
    if (ids.size >= MAX_EVENTS) break;
  }
  if (ids.size === 0) {
    throw new EventbriteError("No upcoming events found on that organizer page.", 404);
  }
  return [...ids];
}

async function fetchEvent(origin: string, id: string): Promise<EventbriteEvent> {
  // /e/<id> redirects to the canonical slugged URL.
  const html = await fetchHtml(`${origin}/e/${id}`);
  const data = findJsonLdEvent(html);
  if (!data) throw new EventbriteError("No event data found on the event page.", 502);
  return mapEvent(id, data);
}

async function fetchHtml(url: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        // Eventbrite serves a stripped page to unknown clients.
        "User-Agent":
          "Mozilla/5.0 (compatible; comedy-site-importer/1.0)",
        "Accept-Language": "en",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
    });
  } catch {
    throw new EventbriteError("Couldn't reach Eventbrite.", 502);
  }
  if (!HOST_RE.test(new URL(res.url).hostname)) {
    throw new EventbriteError("Eventbrite redirected somewhere unexpected.", 502);
  }
  if (res.status === 404) throw new EventbriteError("Eventbrite page not found.", 404);
  if (!res.ok) throw new EventbriteError(`Eventbrite answered ${res.status}.`, 502);
  return res.text();
}

// --- JSON-LD parsing -------------------------------------------------------

type JsonLd = Record<string, unknown>;

function findJsonLdEvent(html: string): JsonLd | undefined {
  const scripts = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  for (const [, body] of scripts) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      continue;
    }
    const candidates = Array.isArray(parsed)
      ? parsed
      : ((parsed as JsonLd)["@graph"] as unknown[] | undefined) ?? [parsed];
    for (const c of candidates) {
      if (isObj(c) && isEventType(c["@type"])) return c;
    }
  }
}

function isEventType(type: unknown) {
  const types = Array.isArray(type) ? type : [type];
  return types.some((t) => typeof t === "string" && /Event$/.test(t));
}

function mapEvent(id: string, d: JsonLd): EventbriteEvent {
  const startDate = str(d.startDate);
  if (!startDate || Number.isNaN(Date.parse(startDate))) {
    throw new EventbriteError("Event has no start date.", 502);
  }
  const offers = asArray(d.offers).filter(isObj);
  const { price, isFree, soldOut } = mapOffers(offers);

  let status: EventbriteStatus = "onSale";
  if (/EventCancelled$/.test(str(d.eventStatus) ?? "")) status = "cancelled";
  else if (soldOut) status = "soldOut";
  else if (isFree) status = "free";

  return {
    eventbriteId: id,
    url: stripQuery(str(d.url)) ?? `https://www.eventbrite.com/e/${id}`,
    title: decodeEntities(str(d.name) ?? "Untitled event"),
    description: optional(decodeEntities(str(d.description) ?? "")),
    startsAt: new Date(startDate).toISOString(),
    endsAt: str(d.endDate) ? new Date(str(d.endDate)!).toISOString() : undefined,
    status,
    price,
    venue: mapVenue(d.location),
    lineup: asArray(d.performer)
      .filter(isObj)
      .map((p) => decodeEntities(str(p.name) ?? "").trim())
      .filter(Boolean),
    imageUrl: originalImageUrl(str(asArray(d.image)[0])),
  };
}

function mapOffers(offers: JsonLd[]) {
  const currency = offers.map((o) => str(o.priceCurrency)).find(Boolean);
  const prices = offers
    .flatMap((o) => [o.lowPrice, o.highPrice, o.price])
    .map((p) => (p === undefined || p === null ? NaN : Number(p)))
    .filter((p) => !Number.isNaN(p));
  const availabilities = offers.map((o) => str(o.availability) ?? "");
  const soldOut =
    availabilities.length > 0 &&
    availabilities.every((a) => /(SoldOut|OutOfStock)$/.test(a));

  if (prices.length === 0) return { price: undefined, isFree: false, soldOut };
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  if (high === 0) return { price: "Free", isFree: true, soldOut };

  const fmt = (n: number) =>
    currency
      ? new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(n)
      : n.toFixed(2);
  const price = low === high ? fmt(low) : `${fmt(low)}–${fmt(high)}`;
  return { price, isFree: false, soldOut };
}

function mapVenue(location: unknown): EventbriteVenue | undefined {
  const place = asArray(location).find(isObj);
  if (!place || /VirtualLocation$/.test(str(place["@type"]) ?? "")) return undefined;
  const name = decodeEntities(str(place.name) ?? "").trim();
  if (!name) return undefined;

  const addr = isObj(place.address) ? place.address : {};
  let address = str(addr.streetAddress);
  let postalCode = str(addr.postalCode);
  // Eventbrite often packs "Street 1, 12043 Berlin" into streetAddress.
  const packed = address?.match(/^(.*?),\s*(\d{4,5})\s+[^,]+$/);
  if (packed) {
    address = packed[1];
    postalCode ??= packed[2];
  }
  return {
    name,
    address: optional(address),
    postalCode: optional(postalCode),
    city: optional(str(addr.addressLocality)),
    country: optional(str(addr.addressCountry)),
    ...mapGeo(place.geo),
  };
}

function mapGeo(geo: unknown): { lat?: number; lng?: number } {
  if (!isObj(geo)) return {};
  const lat = Number(geo.latitude);
  const lng = Number(geo.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return {};
  }
  return { lat, lng };
}

// --- helpers ---------------------------------------------------------------

function isObj(v: unknown): v is JsonLd {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function optional(v: string | undefined) {
  return v && v.trim() ? v.trim() : undefined;
}

function asArray(v: unknown): unknown[] {
  return v === undefined || v === null ? [] : Array.isArray(v) ? v : [v];
}

// img.evbuc.com/<url-encoded original>?crop=… is a resized proxy; the
// original upload is encoded in its path.
function originalImageUrl(url: string | undefined) {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    if (u.hostname === "img.evbuc.com") {
      const inner = new URL(decodeURIComponent(u.pathname.slice(1)));
      if (inner.protocol === "https:") return inner.toString();
    }
  } catch {
    // fall through to the URL as given
  }
  return url;
}

function stripQuery(url: string | undefined) {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    u.search = "";
    return u.toString();
  } catch {
    return undefined;
  }
}

function decodeEntities(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}
