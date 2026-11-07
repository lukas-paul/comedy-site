import type { SanityClient } from "sanity";

import type { EventbriteEvent, EventbriteVenue } from "../../../lib/eventbrite";

export type ImportOptions = {
  /** Show to attach the events to, or undefined for one-off events. */
  showId?: string;
  /** Copy Eventbrite's image and description (otherwise the show's are used). */
  includeContent: boolean;
};

export type ImportResult =
  | { eventbriteId: string; ok: true; documentId: string }
  | { eventbriteId: string; ok: false; message: string };

type VenueDoc = {
  _id: string;
  name?: string;
  address?: string;
  postalCode?: string;
};

/** A venue to reference: its published ID, and whether that version exists yet. */
type VenueRef = { id: string; published: boolean };

/** Deterministic IDs make a repeated import a no-op instead of a duplicate. */
export const eventDocumentId = (eventbriteId: string) => `eventbrite-${eventbriteId}`;

/**
 * Creates one draft event per Eventbrite event, using the Studio user's own
 * client (and therefore their permissions). Venues are matched against
 * existing ones by name or address and created when missing.
 */
export async function importEvents(
  client: SanityClient,
  events: EventbriteEvent[],
  options: ImportOptions,
  onProgress?: (done: number) => void
): Promise<ImportResult[]> {
  const venues = await client.fetch<VenueDoc[]>(
    `*[_type == "venue"]{ _id, name, address, postalCode }`
  );
  const venueRefs = new Map<string, Promise<VenueRef>>();
  const assetIds = new Map<string, Promise<string>>();

  const results: ImportResult[] = [];
  for (const event of events) {
    try {
      let venueRef: VenueRef | undefined;
      if (event.venue) {
        const key = normalize(event.venue.name);
        if (!venueRefs.has(key)) {
          venueRefs.set(key, findOrCreateVenue(client, venues, event.venue));
        }
        venueRef = await venueRefs.get(key);
      }

      let assetId: string | undefined;
      if (options.includeContent && event.imageUrl) {
        if (!assetIds.has(event.imageUrl)) {
          assetIds.set(event.imageUrl, uploadImage(client, event.imageUrl, event.eventbriteId));
        }
        assetId = await assetIds.get(event.imageUrl);
      }

      const draftId = `drafts.${eventDocumentId(event.eventbriteId)}`;
      await client.createIfNotExists({
        _id: draftId,
        _type: "event",
        eventbriteId: event.eventbriteId,
        title: event.title,
        slug: { _type: "slug", current: slugify(`${event.title} ${event.startsAt.slice(0, 10)}`) },
        startsAt: event.startsAt,
        status: event.status,
        ...(event.status === "cancelled" ? {} : { ticketUrl: event.url }),
        ...(event.price ? { price: event.price } : {}),
        ...(event.lineup.length ? { lineup: event.lineup } : {}),
        ...(options.showId ? { show: ref(options.showId) } : {}),
        ...(venueRef ? { venue: venueReference(venueRef) } : {}),
        ...(assetId
          ? { image: { _type: "image", asset: ref(assetId), alt: event.title } }
          : {}),
        ...(options.includeContent && event.description
          ? { description: textToBlocks(event.description) }
          : {}),
      });
      results.push({ eventbriteId: event.eventbriteId, ok: true, documentId: draftId });
    } catch (err) {
      results.push({
        eventbriteId: event.eventbriteId,
        ok: false,
        message: (err as Error).message || "Import failed",
      });
    }
    onProgress?.(results.length);
  }
  return results;
}

async function findOrCreateVenue(
  client: SanityClient,
  venues: VenueDoc[],
  venue: EventbriteVenue
): Promise<VenueRef> {
  const name = normalize(venue.name);
  const address = venue.address ? normalize(venue.address) : undefined;
  // Published venues first, so a match prefers a version that already exists.
  const candidates = [...venues].sort(
    (a, b) => Number(isDraft(a._id)) - Number(isDraft(b._id))
  );
  const match =
    candidates.find((v) => v.name && normalize(v.name) === name) ??
    (address
      ? candidates.find(
          (v) =>
            v.address &&
            normalize(v.address) === address &&
            (!venue.postalCode || !v.postalCode || v.postalCode === venue.postalCode)
        )
      : undefined);
  if (match) {
    const id = match._id.replace(/^drafts\./, "");
    return { id, published: venues.some((v) => v._id === id) };
  }

  // Venues are plain reference data, so they're created published: a draft
  // event can't be published while it references an unpublished venue.
  const created = await client.createIfNotExists({
    _id: `eventbrite-venue-${slugify(venue.name)}`,
    _type: "venue",
    name: venue.name,
    ...(venue.address ? { address: venue.address } : {}),
    ...(venue.postalCode ? { postalCode: venue.postalCode } : {}),
    ...(venue.city ? { city: venue.city } : {}),
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      [venue.name, venue.address, [venue.postalCode, venue.city].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ")
    )}`,
  });
  return { id: created._id, published: true };
}

/**
 * A reference to a venue that only exists as a draft must be weak, or Sanity
 * rejects it. `_strengthenOnPublish` is what the Studio itself uses: the
 * reference becomes strong when the event is published (which then requires
 * the venue to be published first).
 */
function venueReference({ id, published }: VenueRef) {
  return published
    ? ref(id)
    : { ...ref(id), _weak: true, _strengthenOnPublish: { type: "venue" } };
}

function isDraft(id: string) {
  return id.startsWith("drafts.");
}

async function uploadImage(client: SanityClient, url: string, eventbriteId: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't download the image (${res.status})`);
  // Sanity de-duplicates identical files, so a shared image is stored once.
  const asset = await client.assets.upload("image", await res.blob(), {
    filename: `eventbrite-${eventbriteId}`,
  });
  return asset._id;
}

function ref(id: string) {
  return { _type: "reference", _ref: id };
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/str(asse|\.)/g, "str")
    .replace(/[^a-z0-9]/g, "");
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96)
    .replace(/-+$/, "");
}

function key() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

/** Plain text → Portable Text paragraphs (blank lines split paragraphs). */
function textToBlocks(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((paragraph) => ({
      _type: "block",
      _key: key(),
      style: "normal",
      markDefs: [],
      children: [{ _type: "span", _key: key(), text: paragraph, marks: [] }],
    }));
}
