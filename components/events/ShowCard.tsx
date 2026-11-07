import NextLink from "next/link";

import { SanityImage } from "@/components/ui/SanityImage";
import { formatEventDate, isUpcoming } from "@/lib/dates";
import type { ShowCardData } from "@/sanity/lib/types";

// Cards look like posters pinned to a wall: each gets its own spot colour
// and a slightly different tilt.
const VARIANTS = [
  { bg: "bg-red", tilt: "-rotate-2" },
  { bg: "bg-yellow", tilt: "rotate-1" },
  { bg: "bg-paper", tilt: "-rotate-1" },
];

export function ShowCard({ show, index = 0 }: { show: ShowCardData; index?: number }) {
  const nextDate = show.dates.find((date) => date && isUpcoming(date));
  const variant = VARIANTS[index % VARIANTS.length];

  return (
    <NextLink
      href={`/shows/${show.slug}`}
      className={`group block border-[3px] border-ink bg-paper p-3 shadow-[6px_6px_0_var(--ink)] transition-transform duration-200 hover:rotate-0 hover:-translate-y-1 ${variant.tilt}`}
    >
      <div className={`duotone relative aspect-[4/5] ${variant.bg}`}>
        {show.image ? (
          <SanityImage
            image={show.image}
            alt={show.image.alt ?? show.title}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="hatch absolute inset-0 opacity-30" />
        )}
        <h3 className="tape absolute bottom-6 left-3 z-10 max-w-[90%] text-3xl">
          {show.title}
        </h3>
      </div>
      <div className="px-1 pt-4 pb-1">
        {show.tagline && <p className="leading-snug">{show.tagline}</p>}
        <p className="mt-2 font-mono text-xs font-bold uppercase">
          {nextDate ? `Next → ${formatEventDate(nextDate)}` : show.schedule}
        </p>
      </div>
    </NextLink>
  );
}
