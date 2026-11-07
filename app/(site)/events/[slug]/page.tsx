import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EventView } from "@/components/views/EventView";
import { formatLongDate } from "@/lib/dates";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { EVENT_QUERY, EVENT_SLUGS_QUERY } from "@/sanity/lib/queries";
import type { EventData } from "@/sanity/lib/types";

// Re-render hourly so the page flips to "this event has passed" on time.
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await client.fetch(EVENT_SLUGS_QUERY);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { data: event } = await sanityFetch({
    query: EVENT_QUERY,
    params: { slug },
    stega: false,
  });

  if (!event) return {};

  const ogImage = event.seo?.ogImage ?? event.image;

  return {
    title: event.seo?.metaTitle || `${event.title} · ${formatLongDate(event.startsAt)}`,
    description:
      event.seo?.metaDescription ??
      [formatLongDate(event.startsAt), event.venue?.name, event.show?.tagline]
        .filter(Boolean)
        .join(" · "),
    openGraph: ogImage
      ? { images: [{ url: urlFor(ogImage).width(1200).height(630).url() }] }
      : undefined,
  };
}

export default async function EventPage({ params }: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const { data: event } = await sanityFetch({
    query: EVENT_QUERY,
    params: { slug },
    stega: false,
  });

  if (!event) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        // Rich results in search: https://developers.google.com/search/docs/appearance/structured-data/event
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd(event)) }}
      />
      <EventView event={event} />
    </>
  );
}

function eventJsonLd(event: EventData) {
  const statusMap = {
    cancelled: "https://schema.org/EventCancelled",
    soldOut: "https://schema.org/EventScheduled",
    onSale: "https://schema.org/EventScheduled",
    free: "https://schema.org/EventScheduled",
  } as const;

  return {
    "@context": "https://schema.org",
    "@type": "ComedyEvent",
    name: event.title,
    startDate: event.startsAt,
    doorTime: event.doorsAt ?? undefined,
    eventStatus: statusMap[event.status ?? "onSale"],
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: event.image ? [urlFor(event.image).width(1200).url()] : undefined,
    location: event.venue
      ? {
          "@type": "Place",
          name: event.venue.name,
          address: {
            "@type": "PostalAddress",
            streetAddress: event.venue.address ?? undefined,
            postalCode: event.venue.postalCode ?? undefined,
            addressLocality: event.venue.city ?? undefined,
          },
        }
      : undefined,
    offers: event.ticketUrl
      ? {
          "@type": "Offer",
          url: event.ticketUrl,
          availability:
            event.status === "soldOut"
              ? "https://schema.org/SoldOut"
              : "https://schema.org/InStock",
        }
      : undefined,
    performer: event.lineup?.map((name) => ({ "@type": "Person", name })),
  };
}
