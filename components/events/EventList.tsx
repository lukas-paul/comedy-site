import NextLink from "next/link";

import { TicketButton } from "@/components/events/TicketButton";
import { dateParts, formatTime, isUpcoming } from "@/lib/dates";
import type { EventCardData } from "@/sanity/lib/types";

export function EventList({
  events,
  hideShow = false,
  emptyText = "Nothing booked right now. We're probably writing.",
  now,
}: {
  events: EventCardData[];
  /** On a show's own page the show name is redundant */
  hideShow?: boolean;
  emptyText?: string;
  /** Reference time; pass the server's when rendering inside a client component */
  now?: number;
}) {
  const upcoming = events.filter((event) => isUpcoming(event.startsAt, now));

  if (upcoming.length === 0) {
    return <p className="font-marker text-2xl">{emptyText}</p>;
  }

  return (
    <ul className="border-t-[3px] border-ink">
      {upcoming.map((event) => (
        <li key={event._id} className="border-b-[3px] border-ink">
          <EventRow event={event} hideShow={hideShow} />
        </li>
      ))}
    </ul>
  );
}

function EventRow({ event, hideShow }: { event: EventCardData; hideShow: boolean }) {
  const { day, month, weekday } = dateParts(event.startsAt);
  const cancelled = event.status === "cancelled";
  const venue = [event.venue?.name, event.venue?.city].filter(Boolean).join(", ");
  const showNote =
    !hideShow && event.show && event.show.title !== event.title ? event.show : null;

  return (
    <div className="group relative grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-4 py-5 transition-colors hover:bg-yellow sm:grid-cols-[auto_1fr_auto] sm:gap-x-8 sm:px-3">
      <div className="w-20 text-center leading-none sm:w-24">
        <div className="font-mono text-xs font-bold uppercase">{weekday}</div>
        <div className="font-narrow text-6xl font-black tracking-tight sm:text-7xl">{day}</div>
        <div className="font-mono text-sm font-bold uppercase">{month}</div>
      </div>

      <div className="min-w-0">
        {showNote && (
          <NextLink
            href={`/shows/${showNote.slug}`}
            className="relative z-10 mb-1 inline-block -rotate-1 font-marker text-red hover:underline"
          >
            {showNote.title} presents
          </NextLink>
        )}
        <NextLink
          href={`/events/${event.slug}`}
          className={`block text-2xl leading-none font-black uppercase after:absolute after:inset-0 sm:text-4xl ${cancelled ? "line-through decoration-red decoration-4" : ""}`}
        >
          {event.title}
        </NextLink>
        <p className="mt-2 font-mono text-sm uppercase">
          {[formatTime(event.startsAt), venue, event.price].filter(Boolean).join(" / ")}
        </p>
      </div>

      <div className="relative z-10 col-start-2 sm:col-start-3">
        <TicketButton status={event.status} ticketUrl={event.ticketUrl} />
      </div>
    </div>
  );
}
