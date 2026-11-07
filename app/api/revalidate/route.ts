import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { parseBody } from "next-sanity/webhook";

// Called by a Sanity webhook whenever content is published, changed or
// deleted. Query results are cached with no expiry, and <SanityLive /> only
// clears them while someone has the site open; this makes sure a publish
// always reaches the live site.
//
// Sanity webhook (sanity.io/manage → API → Webhooks):
//   URL:        https://<site>/api/revalidate
//   Trigger on: Create, Update, Delete    Projection: {_type}
//   Secret:     same value as SANITY_REVALIDATE_SECRET

export async function POST(request: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    return Response.json({ error: "SANITY_REVALIDATE_SECRET is not set" }, { status: 500 });
  }

  // Also waits until the change is readable from the Sanity API, so the
  // re-render doesn't fetch the old content again.
  const { isValidSignature, body } = await parseBody<{ _type?: string }>(request, secret, true);
  if (!isValidSignature) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  // The site is small and pages share data (an event shows up on the home
  // page, its show page and its own page), so refresh everything.
  revalidatePath("/", "layout");
  return Response.json({ revalidated: true, type: body?._type ?? null });
}
