"use client";

import Image, { type ImageLoader } from "next/image";
import type { SanityImageSource } from "@sanity/image-url";

import { urlFor } from "@/sanity/lib/image";

// Sanity's CDN resizes on the fly, so skip Next's optimizer and ask it for
// the exact width instead.
const sanityLoader: ImageLoader = ({ src, width, quality }) =>
  `${src}&w=${width}&q=${quality ?? 75}`;

export function SanityImage({
  image,
  alt,
  sizes = "100vw",
  className,
  fill = true,
  priority,
}: {
  image?: SanityImageSource | null;
  alt: string;
  sizes?: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
}) {
  if (!image) return null;

  const src = urlFor(image).auto("format").fit("max").url();

  return (
    <Image
      src={src}
      loader={sanityLoader}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={className}
      priority={priority}
    />
  );
}