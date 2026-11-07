import NextLink from "next/link";

import { dateParts, isUpcoming } from "@/lib/dates";
import type { EventCardData } from "@/sanity/lib/types";

/** Ticker tape of the next few dates. */
export function Marquee({ events }: { events: EventCardData[] }) {
  const next = events
    .filter((event) => isUpcoming(event.startsAt) && event.status !== "cancelled")
    .slice(0, 6);

  if (next.length === 0) return null;

  // Rendered twice so the -50% translate loops seamlessly
  const items = [...next, ...next];

  return (
    <div className="overflow-hidden border-y-[3px] border-ink bg-yellow py-2">
      <div className="animate-marquee flex w-max">
        {items.map((event, i) => {
          const { day, month, weekday } = dateParts(event.startsAt);
          return (
            <NextLink
              key={`${event._id}-${i}`}
              href={`/events/${event.slug}`}
              aria-hidden={i >= next.length}
              tabIndex={i >= next.length ? -1 : undefined}
              className="flex shrink-0 items-center gap-3 px-6 font-mono text-sm font-bold uppercase hover:underline"
            >
              <span>
                {weekday} {day} {month}
              </span>
              <span className="font-sans font-black font-narrow text-lg">
                {event.title}
              </span>
              {event.venue?.name && <span>@ {event.venue.name}</span>}
              <span aria-hidden className="pl-6 text-red">
                ✶
              </span>
            </NextLink>
          );
        })}
      </div>
    </div>
  );
}
