"use client";

import { useMemo, useRef, useState } from "react";

import { EventList } from "@/components/events/EventList";
import { MapSection } from "@/components/map/MapSection";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { dayKey, isUpcoming } from "@/lib/dates";
import { toMapVenues } from "@/lib/geo";
import { SHOW_TYPES, type ShowType } from "@/lib/showTypes";
import type { EventCardData } from "@/sanity/lib/types";

type Filters = { type: ShowType | null; today: boolean };

const PAGE_SIZE = 10;

/**
 * The home page's Dates list and Map, driven by one set of filters (show
 * type and "today"). The same chips appear above the list and inside the
 * big map.
 *
 * `now` is the server's render time. The page HTML is cached, so using the
 * browser's clock for the first render could disagree with it about which
 * dates are upcoming and break hydration. "Today" re-reads the clock when
 * it's switched on, so a page cached since yesterday still gets it right.
 */
export function DatesAndMap({ events, now }: { events: EventCardData[]; now: number }) {
  const [filters, setFilters] = useState<Filters>({ type: null, today: false });
  const [clock, setClock] = useState(now);
  const [page, setPage] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  const upcoming = useMemo(
    () => events.filter((event) => isUpcoming(event.startsAt, now)),
    [events, now]
  );

  const todayKey = dayKey(clock);
  const matchesType = (e: EventCardData, type: ShowType | null) =>
    type === null || e.show?.showType === type;
  const matchesDay = (e: EventCardData, today: boolean) =>
    !today || dayKey(e.startsAt) === todayKey;

  // Offer every type that has upcoming dates, so chips don't vanish when
  // "Today" is switched on; counts reflect the other active filter.
  const typeOptions = SHOW_TYPES.filter((t) =>
    upcoming.some((e) => e.show?.showType === t.value)
  ).map((t) => ({
    ...t,
    count: upcoming.filter((e) => matchesType(e, t.value) && matchesDay(e, filters.today)).length,
  }));

  // A type that no longer has dates (content changed) means "all".
  const type = typeOptions.some((o) => o.value === filters.type) ? filters.type : null;
  const filtered = upcoming.filter((e) => matchesType(e, type) && matchesDay(e, filters.today));
  const counts = {
    all: upcoming.filter((e) => matchesDay(e, filters.today)).length,
    today: upcoming.filter((e) => matchesType(e, type) && matchesDay(e, true)).length,
  };

  // The list is paged; the map always shows every filtered date.
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageEvents = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  const goToPage = (next: number) => {
    setPage(next);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const allVenues = useMemo(() => toMapVenues(upcoming, now), [upcoming, now]);
  const venues = toMapVenues(filtered, now);

  const typeTitle = typeOptions.find((o) => o.value === type)?.title;
  const label = [typeTitle, filters.today && "today"].filter(Boolean).join(" · ");
  const emptyText = filters.today
    ? typeTitle
      ? `No ${typeTitle} tonight.`
      : "Nothing on today. Check the other dates!"
    : typeTitle
      ? `No ${typeTitle} dates right now.`
      : "Nothing booked right now. We're probably writing.";

  const filterBar =
    upcoming.length > 0 ? (
      <FilterBar
        type={type}
        today={filters.today}
        typeOptions={typeOptions}
        counts={counts}
        onType={(next) => {
          setPage(0);
          setFilters((f) => ({ ...f, type: next }));
        }}
        onToday={() => {
          if (!filters.today) setClock(Date.now());
          setPage(0);
          setFilters((f) => ({ ...f, today: !f.today }));
        }}
      />
    ) : null;

  return (
    <>
      <section ref={sectionRef} id="events" className="mx-auto max-w-6xl scroll-mt-6 px-4 pt-20 sm:px-6">
        <SectionHeading count={filtered.length} note="come early, sit front row">
          Dates
        </SectionHeading>
        {filterBar && <div className="mb-8">{filterBar}</div>}
        <EventList events={pageEvents} now={now} emptyText={emptyText} />
        {pageCount > 1 && (
          <Pagination page={currentPage} pageCount={pageCount} onPage={goToPage} />
        )}
      </section>

      {allVenues.length > 0 && (
        <section id="map" className="mx-auto max-w-6xl scroll-mt-6 px-4 pt-24 sm:px-6">
          <SectionHeading note={label ? `${label} only` : "find a stage near you"}>
            Map
          </SectionHeading>
          <MapSection venues={venues} filters={filterBar} emptyText={emptyText} />
          {venues.length === 0 && <p className="mt-4 font-marker text-xl">{emptyText}</p>}
        </section>
      )}
    </>
  );
}

function Pagination({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}) {
  const button =
    "border-[3px] border-ink px-3 py-1.5 font-mono text-sm font-bold uppercase transition-transform";
  const idle = `${button} bg-paper hover:-rotate-1 hover:bg-yellow disabled:pointer-events-none disabled:opacity-30`;

  return (
    <nav aria-label="Dates pages" className="mt-8 flex flex-wrap items-center gap-3">
      <button type="button" className={idle} disabled={page === 0} onClick={() => onPage(page - 1)}>
        ← Earlier
      </button>
      {Array.from({ length: pageCount }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-current={i === page ? "page" : undefined}
          aria-label={`Page ${i + 1}`}
          onClick={() => onPage(i)}
          className={
            i === page
              ? `${button} -rotate-2 bg-ink text-paper shadow-[4px_4px_0_var(--red)]`
              : idle
          }
        >
          {i + 1}
        </button>
      ))}
      <button
        type="button"
        className={idle}
        disabled={page === pageCount - 1}
        onClick={() => onPage(page + 1)}
      >
        Later →
      </button>
    </nav>
  );
}

function FilterBar({
  type,
  today,
  typeOptions,
  counts,
  onType,
  onToday,
}: {
  type: ShowType | null;
  today: boolean;
  typeOptions: { value: ShowType; title: string; count: number }[];
  counts: { all: number; today: number };
  onType: (type: ShowType | null) => void;
  onToday: () => void;
}) {
  return (
    <div role="group" aria-label="Filter dates" className="flex flex-wrap items-center gap-3">
      <Chip pressed={today} onClick={onToday} accent>
        Today <Count n={counts.today} />
      </Chip>
      {typeOptions.length > 0 && (
        <>
          <span aria-hidden className="h-8 w-[3px] bg-ink" />
          <Chip pressed={type === null} onClick={() => onType(null)}>
            All types <Count n={counts.all} />
          </Chip>
          {typeOptions.map((option) => (
            <Chip
              key={option.value}
              pressed={type === option.value}
              onClick={() => onType(type === option.value ? null : option.value)}
            >
              {option.title} <Count n={option.count} />
            </Chip>
          ))}
        </>
      )}
    </div>
  );
}

function Chip({
  pressed,
  onClick,
  accent = false,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  /** Yellow when off, so "Today" stands apart from the type chips */
  accent?: boolean;
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
          : `${accent ? "bg-yellow" : "bg-paper"} hover:-rotate-1 hover:bg-yellow`
      }`}
    >
      {children}
    </button>
  );
}

function Count({ n }: { n: number }) {
  return <span className="opacity-70">({n})</span>;
}
