import { createDataAttribute } from "next-sanity";

import { dataset, projectId, studioUrl } from "@/sanity/env";

export function dataAttr(props: { id: string; type: string; path: string }) {
  return createDataAttribute({
    projectId,
    dataset,
    baseUrl: studioUrl,
    ...props,
  }).toString();
}
