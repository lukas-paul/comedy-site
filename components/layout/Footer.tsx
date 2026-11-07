import { CmsLink } from "@/components/ui/CmsLink";
import type { SiteSettings } from "@/sanity/lib/types";

export function Footer({ settings }: { settings?: SiteSettings }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6">
        <p className="font-wide text-[clamp(2.5rem,9vw,7rem)] leading-[0.85] font-black uppercase">
          {settings?.title ?? "Comedy"}
        </p>

        <div className="mt-12 grid gap-10 font-mono text-sm sm:grid-cols-3">
          <p className="opacity-70">
            {settings?.footerText ?? `© ${year} ${settings?.title ?? ""}`}
          </p>

          {settings?.socialLinks && settings.socialLinks.length > 0 && (
            <div>
              <h3 className="mb-3 font-marker text-lg text-yellow">follow us</h3>
              <ul className="space-y-1 uppercase">
                {settings.socialLinks.map((link) => (
                  <li key={link._key}>
                    <CmsLink link={link} className="hover:text-red" />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {settings?.footerLinks && settings.footerLinks.length > 0 && (
            <div>
              <h3 className="mb-3 font-marker text-lg text-yellow">the boring bits</h3>
              <ul className="space-y-1 uppercase">
                {settings.footerLinks.map((link) => (
                  <li key={link._key}>
                    <CmsLink link={link} className="hover:text-red" />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
