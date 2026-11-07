import NextImage from "next/image";
import { PortableText, type PortableTextComponents } from "@portabletext/react";

import { urlFor } from "@/sanity/lib/image";
import type { RichText, RichTextImage } from "@/sanity/lib/types";

function RichTextImageBlock({ value }: { value: RichTextImage }) {
  if (!value.asset) return null;

  const dimensions = value.asset.metadata?.dimensions;
  const src = urlFor(value).auto("format").url();

  return (
    <figure className="my-8">
      <NextImage
        src={src}
        alt={value.alt ?? ""}
        width={dimensions?.width ?? 1600}
        height={dimensions?.height ?? 900}
        className="h-auto w-full"
      />
      {value.caption && (
        <figcaption className="mt-2 text-sm opacity-70">{value.caption}</figcaption>
      )}
    </figure>
  );
}

const components: PortableTextComponents = {
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target={value?.openInNewTab ? "_blank" : undefined}
        rel={value?.openInNewTab ? "noopener noreferrer" : undefined}
        className="underline underline-offset-4 hover:no-underline"
      >
        {children}
      </a>
    ),
  },
  types: {
    richTextImage: RichTextImageBlock,
  },
};

export function PortableTextContent({
  value,
  className,
  dataSanity,
}: {
  value?: RichText | null;
  className?: string;
  dataSanity?: string;
}) {
  if (!value) return null;

  return (
    <div
      data-sanity={dataSanity}
      className={`prose prose-neutral max-w-none ${className ?? ""}`}
    >
      <PortableText value={value} components={components} />
    </div>
  );
}
