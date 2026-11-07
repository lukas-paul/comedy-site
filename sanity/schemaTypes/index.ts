import type { SchemaTypeDefinition } from "sanity";

import { event } from "./documents/event";
import { home } from "./documents/home";
import { show } from "./documents/show";
import { siteSettings } from "./documents/siteSettings";
import { venue } from "./documents/venue";
import { blockContent } from "./objects/blockContent";
import { link } from "./objects/link";
import { richTextImage } from "./objects/richTextImage";
import { seo } from "./objects/seo";

// Documents that exist exactly once, with a fixed _id.
export const SINGLETON_TYPES = new Set(["home", "siteSettings"]);

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // Documents
    home,
    event,
    show,
    venue,
    siteSettings,
    // Objects
    blockContent,
    link,
    seo,
    richTextImage,
  ],
};
