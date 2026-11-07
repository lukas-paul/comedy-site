import NextLink from "next/link";

import { SanityImage } from "@/components/ui/SanityImage";
import type { SiteSettings } from "@/sanity/lib/types";

const NAV = [
  { label: "Dates", href: "/#events" },
  { label: "Shows", href: "/#shows" },
  { label: "About", href: "/#about" },
];

export function Header({ settings }: { settings?: SiteSettings }) {
  return (
    <header className="border-b-[3px] border-ink">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-8 gap-y-3 px-4 py-4 sm:px-6">
        <NextLink
          href="/"
          className="flex items-center gap-3 font-wide text-2xl leading-none font-black uppercase sm:text-3xl"
        >
          {settings?.logo && (
            <span className="relative block h-10 w-10">
              <SanityImage image={settings.logo} alt="" sizes="40px" className="object-contain" />
            </span>
          )}
          {settings?.title ?? "Comedy"}
        </NextLink>
        <nav className="flex gap-5 font-mono text-sm font-bold uppercase">
          {NAV.map((item) => (
            <NextLink
              key={item.href}
              href={item.href}
              className="decoration-red decoration-[3px] underline-offset-4 hover:underline"
            >
              {item.label}
            </NextLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
