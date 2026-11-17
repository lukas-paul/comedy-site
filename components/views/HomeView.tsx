import NextLink from "next/link";

import { DatesAndMap } from "@/components/events/DatesAndMap";
import { ShowCard } from "@/components/events/ShowCard";
import { TicketButton } from "@/components/events/TicketButton";
import { Marquee } from "@/components/layout/Marquee";
import { PortableTextContent } from "@/components/ui/PortableTextContent";
import { SanityImage } from "@/components/ui/SanityImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { dateParts, formatTime, isUpcoming } from "@/lib/dates";
import { dataAttr } from "@/sanity/lib/dataAttr";
import type { EventCardData, HomeData, ShowCardData } from "@/sanity/lib/types";

export function HomeView({
  home,
  events,
  shows,
  now,
}: {
  home: HomeData | null;
  events: EventCardData[];
  shows: ShowCardData[];
  /** Render time, shared with the client-side date filter */
  now: number;
}) {
  const attr = (path: string) =>
    home ? dataAttr({ id: home._id, type: home._type, path }) : undefined;
  const upcoming = events.filter((event) => isUpcoming(event.startsAt, now));
  const next = upcoming.find((event) => event.status !== "cancelled");

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 sm:pt-14">
        <h1
          data-sanity={attr("headline")}
          className="misprint font-wide text-[clamp(3rem,11vw,9.5rem)] leading-[0.82] font-black tracking-tight uppercase"
        >
          {home?.headline ?? "Comedy"}
        </h1>
        {home?.scribble && (
          <p
            data-sanity={attr("scribble")}
            className="mt-3 ml-[8%] inline-block -rotate-3 font-marker text-2xl text-red sm:text-3xl"
          >
            {home.scribble}
          </p>
        )}

        <div className="mt-10 grid gap-8 md:grid-cols-[1.35fr_1fr] md:items-start">
          <div className="duotone relative aspect-[4/3] border-[3px] border-ink bg-red">
            {home?.heroImage ? (
              <SanityImage
                image={home.heroImage}
                alt={home.heroImage.alt ?? ""}
                sizes="(min-width: 768px) 60vw, 100vw"
                priority
                className="object-cover"
              />
            ) : (
              <div className="halftone absolute inset-0 opacity-60" />
            )}
            {next && (
              <NextLink
                href={`/events/${next.slug}`}
                className="tape absolute right-[-0.5rem] bottom-8 z-10 max-w-[95%] text-[clamp(1.5rem,4vw,2.75rem)] hover:bg-red hover:text-ink"
              >
                Next: {next.title}
              </NextLink>
            )}
          </div>

          <div className="space-y-8">
            {home?.intro && (
              <p data-sanity={attr("intro")} className="text-xl leading-snug sm:text-2xl">
                {home.intro}
              </p>
            )}
            {next && <NextUp event={next} />}
          </div>
        </div>
      </section>

      <Marquee events={events} />

      <DatesAndMap events={events} now={now} />

      {shows.length > 0 && (
        <section id="shows" className="mx-auto max-w-6xl scroll-mt-6 px-4 pt-24 sm:px-6">
          <SectionHeading note="our regular nights">Shows</SectionHeading>
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {shows.map((show, i) => (
              <ShowCard key={show._id} show={show} index={i} />
            ))}
          </div>
        </section>
      )}

      {home?.about && (
        <section id="about" className="mx-auto max-w-6xl scroll-mt-6 px-4 pt-24 sm:px-6">
          <div className="relative border-[3px] border-ink bg-yellow p-6 shadow-[8px_8px_0_var(--ink)] sm:p-12">
            <div className="hatch absolute top-0 right-0 h-full w-1/4 opacity-15" />
            <h2 className="relative font-wide text-4xl leading-[0.9] font-black uppercase sm:text-6xl">
              {home.aboutHeading ?? "About us"}
            </h2>
            <PortableTextContent
              value={home.about}
              dataSanity={attr("about")}
              className="relative mt-8 max-w-2xl text-lg sm:text-xl"
            />
          </div>
        </section>
      )}
    </>
  );
}

/** Poster-style facts for the next date */
function NextUp({ event }: { event: EventCardData }) {
  const { day, month, weekday } = dateParts(event.startsAt);

  return (
    <div className="border-t-[3px] border-ink pt-4">
      <p className="font-mono text-xs font-bold uppercase">Next up ↓</p>
      <p className="mt-2 font-narrow text-6xl leading-[0.85] font-black uppercase">
        {weekday} {day} {month}
      </p>
      <p className="mt-3 font-mono text-sm font-bold uppercase">
        Start {formatTime(event.startsAt)}
        {event.venue?.name && ` / ${event.venue.name}`}
        {event.price && ` / ${event.price}`}
      </p>
      <div className="mt-6">
        <TicketButton status={event.status} ticketUrl={event.ticketUrl} size="lg" />
      </div>
    </div>
  );
}
