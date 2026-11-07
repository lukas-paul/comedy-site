import NextLink from "next/link";

interface LinkLike {
  label: string;
  linkType?: "internal" | "external" | null;
  externalUrl?: string | null;
  internalLink?: { _type: string; slug?: string | null } | null;
  openInNewTab?: boolean | null;
}

export function documentHref(doc?: { _type: string; slug?: string | null } | null) {
  if (!doc) return undefined;
  if (doc._type === "home") return "/";
  if (!doc.slug) return undefined;
  if (doc._type === "show") return `/shows/${doc.slug}`;
  if (doc._type === "event") return `/events/${doc.slug}`;
  return undefined;
}

function resolveHref(link?: LinkLike | null): string | undefined {
  if (!link) return undefined;
  if (link.linkType === "external") return link.externalUrl ?? undefined;
  return documentHref(link.internalLink);
}

export function CmsLink({
  link,
  className,
  children,
}: {
  link?: LinkLike | null;
  className?: string;
  children?: React.ReactNode;
}) {
  const href = resolveHref(link);
  if (!link || !href) return null;

  return (
    <NextLink
      href={href}
      className={className}
      target={link.openInNewTab ? "_blank" : undefined}
      rel={link.openInNewTab ? "noopener noreferrer" : undefined}
    >
      {children ?? link.label}
    </NextLink>
  );
}
