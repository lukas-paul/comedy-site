"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import {
  defineDocuments,
  defineLocations,
  presentationTool,
} from "sanity/presentation";
import { structureTool } from "sanity/structure";

import { apiVersion, dataset, projectId } from "./sanity/env";
import { SINGLETON_TYPES, schema } from "./sanity/schemaTypes";
import { structure } from "./sanity/structure";
import { eventbriteImportTool } from "./sanity/tools/eventbriteImport";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  // Keep the login token in the browser (not a third-party cookie) so Studio
  // tools can send it to our own API routes, e.g. /api/eventbrite/preview.
  auth: { loginMethod: "token" },
  tools: (prev) => [...prev, eventbriteImportTool],
  schema: {
    ...schema,
    templates: (templates) => [
      ...templates.filter(({ schemaType }) => !SINGLETON_TYPES.has(schemaType)),
      {
        id: "event-for-show",
        title: "Event for show",
        schemaType: "event",
        parameters: [{ name: "showId", type: "string" }],
        value: ({ showId }: { showId: string }) => ({
          show: { _type: "reference", _ref: showId },
        }),
      },
    ],
  },
  document: {
    // Singletons can't be duplicated or deleted
    actions: (actions, { schemaType }) =>
      SINGLETON_TYPES.has(schemaType)
        ? actions.filter(
            ({ action }) =>
              action && ["publish", "discardChanges", "restore"].includes(action)
          )
        : actions,
  },
  plugins: [
    structureTool({ structure }),
    presentationTool({
      previewUrl: {
        draftMode: {
          enable: "/api/draft-mode/enable",
        },
      },
      resolve: {
        mainDocuments: defineDocuments([
          { route: "/", filter: `_type == "home" && _id == "home"` },
          {
            route: "/shows/:slug",
            filter: `_type == "show" && slug.current == $slug`,
          },
          {
            route: "/events/:slug",
            filter: `_type == "event" && slug.current == $slug`,
          },
        ]),
        locations: {
          home: defineLocations({
            message: "Shown on the home page",
            locations: [{ title: "Home", href: "/" }],
          }),
          show: defineLocations({
            select: { title: "title", slug: "slug.current" },
            resolve: (doc) => ({
              locations: [
                { title: doc?.title || "Untitled", href: `/shows/${doc?.slug}` },
                { title: "Home", href: "/" },
              ],
            }),
          }),
          event: defineLocations({
            select: {
              title: "title",
              showTitle: "show.title",
              showSlug: "show.slug.current",
              slug: "slug.current",
            },
            resolve: (doc) => ({
              locations: [
                {
                  title: doc?.title || doc?.showTitle || "Untitled",
                  href: `/events/${doc?.slug}`,
                },
                ...(doc?.showSlug
                  ? [{ title: doc.showTitle || "Show", href: `/shows/${doc.showSlug}` }]
                  : []),
                { title: "Home", href: "/" },
              ],
            }),
          }),
        },
      },
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
