import { EventList } from "@/components/events/EventList";
import { PortableTextContent } from "@/components/ui/PortableTextContent";
import { SanityImage } from "@/components/ui/SanityImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Sticker } from "@/components/ui/Sticker";
import { isUpcoming } from "@/lib/dates";
import { dataAttr } from "@/sanity/lib/dataAttr";
import type { ShowData } from "@/sanity/lib/types";

export function ShowView({ show }: { show: ShowData }) {
  const attr = (path: string) => dataAttr({ id: show._id, type: show._type, path });
  const upcomingCount = show.events.filter((event) => isUpcoming(event.startsAt)).length;

  return (
    <article>
      <header className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-8 sm:px-6 md:grid-cols-[1.2fr_1fr] md:items-end">
        <div>
          <p className="font-mono text-sm font-bold uppercase">A regular night ↓</p>
          <h1
            data-sanity={attr("title")}
            className="misprint mt-3 font-wide text-[clamp(3rem,9vw,7.5rem)] leading-[0.82] font-black tracking-tight uppercase"
          >
            {show.title}
          </h1>
          {show.tagline && (
            <p data-sanity={attr("tagline")} className="mt-6 max-w-lg text-2xl leading-snug">
              {show.tagline}
            </p>
          )}
        </div>

        <div className="relative">
          <div className="duotone relative aspect-[4/5] rotate-1 border-[3px] border-ink bg-yellow shadow-[8px_8px_0_var(--ink)]">
            {show.image ? (
              <SanityImage
                image={show.image}
                alt={show.image.alt ?? show.title}
                sizes="(min-width: 768px) 45vw, 100vw"
                priority
                className="object-cover"
              />
            ) : (
              <div className="halftone absolute inset-0 opacity-50" />
            )}
          </div>
          {show.schedule && (
            <Sticker
              tone="red"
              className="absolute -top-8 -left-6 z-10 w-32 rotate-[-12deg] sm:w-36"
            >
              <span data-sanity={attr("schedule")}>{show.schedule}</span>
            </Sticker>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <SectionHeading count={upcomingCount}>Dates</SectionHeading>
        <EventList events={show.events} hideShow />
      </section>

      {show.description && (
        <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <PortableTextContent
            value={show.description}
            dataSanity={attr("description")}
            className="max-w-2xl text-xl"
          />
        </section>
      )}
    </article>
  );
}
