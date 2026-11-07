import NextLink from "next/link";

import { TicketButton } from "@/components/events/TicketButton";
import { PortableTextContent } from "@/components/ui/PortableTextContent";
import { SanityImage } from "@/components/ui/SanityImage";
import { dateParts, formatTime, isUpcoming } from "@/lib/dates";
import { dataAttr } from "@/sanity/lib/dataAttr";
import type { EventData } from "@/sanity/lib/types";

export function EventView({ event }: { event: EventData }) {
  const attr = (path: string) => dataAttr({ id: event._id, type: event._type, path });
  const upcoming = isUpcoming(event.startsAt);
  const cancelled = event.status === "cancelled";
  const { day, month, weekday, year } = dateParts(event.startsAt);
  const venue = event.venue;
  const venueAddress = [venue?.address, [venue?.postalCode, venue?.city].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      {event.show && (
        <NextLink
          href={`/shows/${event.show.slug}`}
          className="inline-block -rotate-2 font-marker text-xl text-red hover:underline"
        >
          ← {event.show.title} presents
        </NextLink>
      )}

      {/* Mobile: title, ticket box, details. Desktop: ticket box in a sticky side column. */}
      <div className="mt-4 grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-y-14">
        <div className="lg:col-start-1">
          <h1
            data-sanity={attr("title")}
            className={`misprint font-wide text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.85] font-black tracking-tight uppercase ${cancelled ? "line-through decoration-red decoration-8" : ""}`}
          >
            {event.title}
          </h1>

          {!upcoming && (
            <p className="mt-6 inline-block rotate-1 bg-yellow px-4 py-2 font-marker text-xl">
              You missed this one.{" "}
              {event.show && (
                <NextLink href={`/shows/${event.show.slug}`} className="underline">
                  Next {event.show.title} →
                </NextLink>
              )}
            </p>
          )}

          {event.image && (
            <div className="duotone relative mt-10 aspect-[16/10] border-[3px] border-ink bg-red">
              <SanityImage
                image={event.image}
                alt={event.image.alt ?? event.title ?? ""}
                sizes="(min-width: 1024px) 60vw, 100vw"
                priority
                className="object-cover"
              />
            </div>
          )}
        </div>

        <aside className="h-fit self-start border-[3px] border-ink bg-paper shadow-[8px_8px_0_var(--ink)] lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="border-b-[3px] border-ink bg-ink p-5 text-paper">
            <p className="font-narrow text-7xl leading-[0.85] font-black uppercase">
              {weekday} {day}
              <br />
              {month} <span className="text-red">{year}</span>
            </p>
          </div>

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 p-5 font-mono text-sm font-bold uppercase">
            {event.doorsAt && (
              <>
                <dt>Doors</dt>
                <dd>{formatTime(event.doorsAt)}</dd>
              </>
            )}
            <dt>Start</dt>
            <dd>{formatTime(event.startsAt)}</dd>
            {event.price && (
              <>
                <dt>Entry</dt>
                <dd data-sanity={attr("price")}>{event.price}</dd>
              </>
            )}
          </dl>

          {venue && (
            <div className="border-t-[3px] border-ink p-5">
              <p className="font-narrow text-3xl leading-none font-black uppercase">
                {venue.name}
              </p>
              {venueAddress && <p className="mt-1 font-mono text-sm">{venueAddress}</p>}
              {venue.mapUrl && (
                <a
                  href={venue.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block font-mono text-sm font-bold uppercase underline decoration-red decoration-2 underline-offset-4"
                >
                  How to get there ↗
                </a>
              )}
            </div>
          )}

          {upcoming && (
            <div className="border-t-[3px] border-ink p-5">
              <TicketButton status={event.status} ticketUrl={event.ticketUrl} size="lg" />
            </div>
          )}
        </aside>

        <div className="empty:hidden lg:col-start-1">
          {event.lineup && event.lineup.length > 0 && (
            <section>
              <h2 className="-rotate-2 font-marker text-2xl text-red">on stage tonight</h2>
              <ul data-sanity={attr("lineup")} className="mt-3 space-y-1">
                {event.lineup.map((name, i) => (
                  <li
                    key={`${name}-${i}`}
                    className={`text-[clamp(2rem,5vw,3.5rem)] leading-[0.95] font-black uppercase ${i % 2 === 0 ? "font-wide" : "font-narrow text-red"}`}
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {event.description && (
            <PortableTextContent
              value={event.description}
              className={`text-xl ${event.lineup?.length ? "mt-14" : ""}`}
            />
          )}
        </div>
      </div>
    </article>
  );
}
