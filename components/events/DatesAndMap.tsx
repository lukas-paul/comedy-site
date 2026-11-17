"use client";

import { useMemo, useState } from "react";

import { EventList } from "@/components/events/EventList";
import { MapSection } from "@/components/map/MapSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { isUpcoming } from "@/lib/dates";
import { toMapVenues } from "@/lib/geo";
import { SHOW_TYPES, type ShowType } from "@/lib/showTypes";
import type { EventCardData } from "@/sanity/lib/types";

/**
 * The home page's Dates list and Map, driven by one show-type filter.
 *
 * `now` is the server's render time. The page HTML is cached, so using the
 * browser's clock here could disagree with it about which dates are still
 * upcoming and break hydration.
 */
export function DatesAndMap({ events, now }: { events: EventCardData[]; now: number }) {
  const [type, setType] = useState<ShowType | null>(null);

  const upcoming = useMemo(
    () => events.filter((event) => isUpcoming(event.startsAt, now)),
    [events, now]
  );

  // Only offer types that have upcoming dates, with how many each has.
  const options = useMemo(
    () =>
      SHOW_TYPES.map((t) => ({
        ...t,
        count: upcoming.filter((e) => e.show?.showType === t.value).length,
      })).filter((t) => t.count > 0),
    [upcoming]
  );

  // A type that no longer has dates (content changed) means "all".
  const active = options.some((o) => o.value === type) ? type : null;
  const filtered = useMemo(
    () => (active ? upcoming.filter((e) => e.show?.showType === active) : upcoming),
    [upcoming, active]
  );

  const allVenues = useMemo(() => toMapVenues(upcoming, now), [upcoming, now]);
  const venues = useMemo(() => toMapVenues(filtered, now), [filtered, now]);
  const activeTitle = options.find((o) => o.value === active)?.title;

  return (
    <>
      <section id="events" className="mx-auto max-w-6xl scroll-mt-6 px-4 pt-20 sm:px-6">
        <SectionHeading count={filtered.length} note="come early, sit front row">
          Dates
        </SectionHeading>

        {options.length > 0 && (
          <div
            role="group"
            aria-label="Filter dates by show type"
            className="mb-8 flex flex-wrap gap-3"
          >
            <FilterChip pressed={active === null} onClick={() => setType(null)}>
              All <Count n={upcoming.length} />
            </FilterChip>
            {options.map((option) => (
              <FilterChip
                key={option.value}
                pressed={active === option.value}
                onClick={() => setType(active === option.value ? null : option.value)}
              >
                {option.title} <Count n={option.count} />
              </FilterChip>
            ))}
          </div>
        )}

        <EventList
          events={filtered}
          now={now}
          emptyText={
            activeTitle
              ? `No ${activeTitle} dates right now.`
              : "Nothing booked right now. We're probably writing."
          }
        />
      </section>

      {allVenues.length > 0 && (
        <section id="map" className="mx-auto max-w-6xl scroll-mt-6 px-4 pt-24 sm:px-6">
          <SectionHeading note={activeTitle ? `${activeTitle} only` : "find a stage near you"}>
            Map
          </SectionHeading>
          <MapSection venues={venues} />
          {venues.length === 0 && (
            <p className="mt-4 font-marker text-xl">No {activeTitle} dates on the map yet.</p>
          )}
        </section>
      )}
    </>
  );
}

function FilterChip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`border-[3px] border-ink px-3 py-1.5 font-mono text-sm font-bold uppercase transition-transform ${
        pressed
          ? "-rotate-2 bg-ink text-paper shadow-[4px_4px_0_var(--red)]"
          : "bg-paper hover:-rotate-1 hover:bg-yellow"
      }`}
    >
      {children}
    </button>
  );
}

function Count({ n }: { n: number }) {
  return <span className="opacity-70">({n})</span>;
}
