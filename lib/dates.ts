// Event times are stored in UTC; always render them in the venue's timezone,
// not the server's or the visitor's.
export const SITE_TIMEZONE =
  process.env.NEXT_PUBLIC_SITE_TIMEZONE || "Europe/Berlin";

const LOCALE = "en-GB";

// An event stays "upcoming" until a few hours after it starts, so it doesn't
// vanish from the site the moment the show begins.
const GRACE_MS = 3 * 60 * 60 * 1000;

export function isUpcoming(startsAt: string, now = Date.now()) {
  return new Date(startsAt).getTime() + GRACE_MS > now;
}

function format(iso: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: SITE_TIMEZONE,
    ...options,
  }).format(new Date(iso));
}

/** "Fri 7 Nov 2026, 20:00" */
export function formatEventDate(iso: string) {
  return format(iso, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "Friday 7 November 2026" */
export function formatLongDate(iso: string) {
  return format(iso, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "20:00" */
export function formatTime(iso: string) {
  return format(iso, { hour: "2-digit", minute: "2-digit" });
}

/** { day: "07", month: "Nov", weekday: "Fri", year: "2026" } for date badges */
export function dateParts(iso: string) {
  return {
    day: format(iso, { day: "2-digit" }),
    month: format(iso, { month: "short" }),
    weekday: format(iso, { weekday: "short" }),
    year: format(iso, { year: "numeric" }),
  };
}

/** "2026-11-20" in the site's timezone, for same-day comparisons */
export function dayKey(date: string | number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SITE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}
