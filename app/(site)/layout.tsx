import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { InkFilters } from "@/components/layout/InkFilters";
import { SanityLive } from "@/sanity/lib/live";
import { SITE_SETTINGS_QUERY } from "@/sanity/lib/queries";
import { sanityFetch } from "@/sanity/lib/live";

export async function generateMetadata(): Promise<Metadata> {
  const { data: settings } = await sanityFetch({
    query: SITE_SETTINGS_QUERY,
    stega: false,
  });

  return {
    title: {
      default: settings?.title ?? "Comedy",
      template: `%s · ${settings?.title ?? "Comedy"}`,
    },
    description: settings?.description,
  };
}

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: settings } = await sanityFetch({
    query: SITE_SETTINGS_QUERY,
    stega: false,
  });
  const { isEnabled: isDraftMode } = await draftMode();

  return (
    <>
      <InkFilters />
      <Header settings={settings ?? undefined} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings ?? undefined} />
      <SanityLive />
      {isDraftMode && <VisualEditing />}
    </>
  );
}
