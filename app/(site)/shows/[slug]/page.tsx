import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ShowView } from "@/components/views/ShowView";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { sanityFetch } from "@/sanity/lib/live";
import { SHOW_QUERY, SHOW_SLUGS_QUERY } from "@/sanity/lib/queries";

// Re-render hourly so past dates drop off the list.
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await client.fetch(SHOW_SLUGS_QUERY);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/shows/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { data: show } = await sanityFetch({
    query: SHOW_QUERY,
    params: { slug },
    stega: false,
  });

  if (!show) return {};

  const ogImage = show.seo?.ogImage ?? show.image;

  return {
    title: show.seo?.metaTitle || show.title,
    description: show.seo?.metaDescription ?? show.tagline,
    openGraph: ogImage
      ? { images: [{ url: urlFor(ogImage).width(1200).height(630).url() }] }
      : undefined,
  };
}

export default async function ShowPage({ params }: PageProps<"/shows/[slug]">) {
  const { slug } = await params;
  const { data: show } = await sanityFetch({
    query: SHOW_QUERY,
    params: { slug },
    stega: false,
  });

  if (!show) notFound();

  return <ShowView show={show} />;
}
