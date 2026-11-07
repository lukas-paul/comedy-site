import type { NextRequest } from "next/server";

import { EventbriteError, fetchEventbriteEvents } from "@/lib/eventbrite";
import { requireStudioUser } from "@/lib/studioAuth";

// Preview what an Eventbrite link would import. Read-only and Studio users
// only: the Studio's "Eventbrite import" tool calls it with the user's login
// token, then writes the selected events itself with that user's permissions.
//
//   GET /api/eventbrite/preview?url=https://www.eventbrite.de/o/riff-city-121190972731
//   Authorization: Bearer <Sanity user token>

export async function GET(request: NextRequest) {
  const denied = await requireStudioUser(request);
  if (denied) return denied;

  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return Response.json({ error: "Missing ?url=" }, { status: 400 });
  }

  try {
    return Response.json(await fetchEventbriteEvents(url));
  } catch (err) {
    if (err instanceof EventbriteError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error("eventbrite preview failed", err);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
  }
}
