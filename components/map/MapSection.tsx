"use client";

import dynamic from "next/dynamic";
import NextLink from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { formatEventDate } from "@/lib/dates";
import { distanceInMetres, formatDistance, type LatLng, type MapVenue } from "@/lib/geo";

const VenueMap = dynamic(() => import("./VenueMap"), {
  ssr: false,
  loading: () => <div className="halftone h-full w-full opacity-20" />,
});

type Locate =
  | { state: "idle" }
  | { state: "locating" }
  | { state: "located"; position: LatLng }
  | { state: "error"; message: string };

/**
 * A static preview map of every venue with upcoming dates. Clicking it opens
 * the full, interactive map in a modal, where visitors can also find the
 * shows closest to them.
 */
export function MapSection({ venues }: { venues: MapVenue[] }) {
  const [open, setOpen] = useState(false);
  const [locate, setLocate] = useState<Locate>({ state: "idle" });

  const findNearMe = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocate({ state: "error", message: "Your browser can't share its location." });
      return;
    }
    setLocate({ state: "locating" });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        setLocate({
          state: "located",
          position: { lat: coords.latitude, lng: coords.longitude },
        }),
      (err) =>
        setLocate({
          state: "error",
          message:
            err.code === err.PERMISSION_DENIED
              ? "Location access was blocked. Allow it in your browser to see what's near you."
              : "Couldn't find your location. Try again in a moment.",
        }),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 }
    );
  }, []);

  const totalDates = venues.reduce((n, v) => n + v.events.length, 0);

  return (
    <>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="group relative block aspect-[4/3] w-full cursor-pointer overflow-hidden border-[3px] border-ink bg-paper text-left shadow-[8px_8px_0_var(--ink)] transition-transform duration-200 hover:-translate-y-1 hover:rotate-[-0.5deg] sm:aspect-[21/9]"
        >
          {/* The preview map is purely decorative; the button is the control. */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <VenueMap venues={venues} interactive={false} />
          </div>
          <span className="tape absolute bottom-5 left-[-0.4rem] z-[500] text-[clamp(1.25rem,3vw,2rem)] group-hover:bg-red group-hover:text-ink">
            Open the map →
          </span>
          <span className="sr-only">
            Open the map of {venues.length} venues with {totalDates} upcoming dates
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            findNearMe();
          }}
          className="btn-ink absolute top-4 right-4 z-[500] px-4 py-2 text-sm"
        >
          <span aria-hidden>◎</span> Shows near me
        </button>
      </div>

      {open && (
        <MapModal
          venues={venues}
          locate={locate}
          onLocate={findNearMe}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function MapModal({
  venues,
  locate,
  onLocate,
  onClose,
}: {
  venues: MapVenue[];
  locate: Locate;
  onLocate: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const user = locate.state === "located" ? locate.position : null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    // No dialog.close() here: its async `close` event would call onClose and
    // undo a re-open (e.g. Strict Mode's double effect). Unmounting removes
    // the dialog from the top layer anyway.
    return () => {
      root.style.overflow = previous;
    };
  }, []);

  const sorted = useMemo(() => {
    const withDistance = venues.map((venue) => ({
      venue,
      distance: user ? distanceInMetres(user, venue) : null,
    }));
    if (user) withDistance.sort((a, b) => a.distance! - b.distance!);
    return withDistance;
  }, [venues, user]);

  const selected = sorted.find((v) => v.venue.id === selectedId) ?? null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="map-title"
      onClose={onClose}
      // Clicking the dimmed backdrop (the dialog element itself) closes it.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto h-[100dvh] max-h-none w-full max-w-none bg-paper p-0 text-ink backdrop:bg-ink/70 sm:h-[min(90dvh,860px)] sm:w-[min(94vw,1200px)] sm:border-[3px] sm:border-ink sm:shadow-[10px_10px_0_var(--red)]"
    >
      <div className="flex h-full flex-col">
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b-[3px] border-ink px-4 py-3 sm:px-5">
          <h2
            id="map-title"
            className="font-wide text-3xl leading-none font-black uppercase sm:text-4xl"
          >
            Map
          </h2>
          <span className="-rotate-3 font-marker text-lg text-red">find a stage</span>
          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={onLocate}
              disabled={locate.state === "locating"}
              className="btn-ink px-3 py-2 text-xs disabled:opacity-60 sm:text-sm"
            >
              <span aria-hidden>◎</span>{" "}
              {locate.state === "locating"
                ? "Locating…"
                : user
                  ? "Update location"
                  : "Near me"}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close map"
              className="grid size-10 place-items-center border-[3px] border-ink font-mono text-xl font-bold hover:bg-yellow"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1.2fr)_minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_360px] md:grid-rows-1">
          <div className="relative min-h-0 border-b-[3px] border-ink md:border-r-[3px] md:border-b-0">
            <VenueMap
              venues={venues}
              selectedId={selectedId}
              onSelect={setSelectedId}
              user={user}
            />
          </div>

          <aside className="min-h-0 overflow-y-auto" aria-live="polite">
            {locate.state === "error" && (
              <p className="border-b-[3px] border-ink bg-yellow px-4 py-3 font-mono text-sm">
                {locate.message}
              </p>
            )}
            {user && !selected && (
              <p className="border-b-[3px] border-ink px-4 py-3 font-mono text-xs uppercase">
                Closest first · your location stays in your browser
              </p>
            )}

            {selected ? (
              <VenueDetail
                venue={selected.venue}
                distance={selected.distance}
                onBack={() => setSelectedId(null)}
              />
            ) : (
              <ul>
                {sorted.map(({ venue, distance }) => (
                  <li key={venue.id} className="border-b-[3px] border-ink">
                    <button
                      type="button"
                      onClick={() => setSelectedId(venue.id)}
                      className="grid w-full grid-cols-[1fr_auto] items-start gap-x-3 px-4 py-3 text-left hover:bg-yellow"
                    >
                      <span className="text-xl leading-tight font-black uppercase">
                        {venue.name}
                      </span>
                      {distance !== null && (
                        <span className="pt-1 font-mono text-sm font-bold whitespace-nowrap">
                          {formatDistance(distance)}
                        </span>
                      )}
                      <span className="col-span-2 mt-1 font-mono text-xs uppercase">
                        Next: {formatEventDate(venue.events[0].startsAt)}
                        {venue.events.length > 1 && ` · +${venue.events.length - 1} more`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>
    </dialog>
  );
}

function VenueDetail({
  venue,
  distance,
  onBack,
}: {
  venue: MapVenue;
  distance: number | null;
  onBack: () => void;
}) {
  return (
    <div className="px-4 py-4">
      <button
        type="button"
        onClick={onBack}
        className="font-mono text-xs font-bold uppercase hover:underline"
      >
        ← All venues
      </button>
      <h3 className="mt-3 text-3xl leading-none font-black uppercase">{venue.name}</h3>
      <p className="mt-2 font-mono text-sm uppercase">
        {[venue.address, distance !== null && `${formatDistance(distance)} away`]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <a
        href={`https://www.openstreetmap.org/directions?to=${venue.lat}%2C${venue.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block font-marker text-lg text-red hover:underline"
      >
        get directions ↗
      </a>

      <ul className="mt-4 border-t-[3px] border-ink">
        {venue.events.map((event) => (
          <li key={event.id} className="border-b-[3px] border-ink">
            <NextLink
              href={`/events/${event.slug}`}
              className="block py-3 hover:bg-yellow"
            >
              <span className="block font-mono text-xs font-bold uppercase">
                {formatEventDate(event.startsAt)}
                {event.status === "soldOut" && " · sold out"}
                {event.status === "free" && " · free"}
              </span>
              <span className="mt-1 block text-xl leading-tight font-black uppercase">
                {event.title}
              </span>
            </NextLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
