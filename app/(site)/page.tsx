import type { Metadata } from "next";

import { HomeView } from "@/components/views/HomeView";
import { urlFor } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { HOME_QUERY, SHOWS_QUERY, UPCOMING_EVENTS_QUERY } from "@/sanity/lib/queries";

// Re-render hourly so events drop off the list once they've happened, even
// when no content has changed.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { data: home } = await sanityFetch({ query: HOME_QUERY, stega: false });

  return {
    title: home?.seo?.metaTitle ? { absolute: home.seo.metaTitle } : undefined,
    description: home?.seo?.metaDescription ?? home?.intro,
    openGraph: home?.seo?.ogImage
      ? { images: [{ url: urlFor(home.seo.ogImage).width(1200).height(630).url() }] }
      : undefined,
  };
}

export default async function HomePage() {
  const [{ data: home }, { data: events }, { data: shows }, now] = await Promise.all([
    sanityFetch({ query: HOME_QUERY, stega: false }),
    sanityFetch({ query: UPCOMING_EVENTS_QUERY, stega: false }),
    sanityFetch({ query: SHOWS_QUERY, stega: false }),
    // One timestamp per render: the HTML is cached, and the client-side
    // date filter must agree with it about what's upcoming.
    renderTime(),
  ]);

  return <HomeView home={home} events={events} shows={shows} now={now} />;
}

async function renderTime() {
  return Date.now();
}
