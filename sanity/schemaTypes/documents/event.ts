import { CalendarIcon } from "@sanity/icons/Calendar";
import { defineArrayMember, defineField, defineType } from "sanity";

import { formatEventDate } from "../../../lib/dates";

export const event = defineType({
  name: "event",
  title: "Event",
  type: "document",
  icon: CalendarIcon,
  description: "A single date. Usually belongs to a show, but can stand alone.",
  groups: [
    { name: "details", title: "Details", default: true },
    { name: "tickets", title: "Tickets" },
    { name: "content", title: "Content" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "show",
      title: "Show",
      type: "reference",
      to: [{ type: "show" }],
      group: "details",
      description:
        "Leave empty for a one-off event. Title, image and description fall back to the show's.",
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "details",
      description: "Optional when a show is selected — defaults to the show's title.",
      validation: (rule) =>
        rule.custom((title, { document }) =>
          title || document?.show ? true : "A one-off event needs a title"
        ),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      group: "details",
      description: "Served at /events/<slug>.",
      options: {
        source: async (doc, { getClient }) => {
          let title = doc.title as string | undefined;
          const showRef = (doc.show as { _ref?: string } | undefined)?._ref;
          if (!title && showRef) {
            title = await getClient({ apiVersion: "2025-01-01" }).fetch<string>(
              `*[_id == $id][0].title`,
              { id: showRef }
            );
          }
          const date = (doc.startsAt as string | undefined)?.slice(0, 10);
          return [title, date].filter(Boolean).join(" ");
        },
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "startsAt",
      title: "Show starts",
      type: "datetime",
      group: "details",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "doorsAt",
      title: "Doors open",
      type: "datetime",
      group: "details",
    }),
    defineField({
      name: "venue",
      title: "Venue",
      type: "reference",
      to: [{ type: "venue" }],
      group: "details",
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "tickets",
      options: {
        list: [
          { title: "On sale", value: "onSale" },
          { title: "Free entry", value: "free" },
          { title: "Sold out", value: "soldOut" },
          { title: "Cancelled", value: "cancelled" },
        ],
        layout: "radio",
      },
      initialValue: "onSale",
    }),
    defineField({
      name: "ticketUrl",
      title: "Ticket link",
      type: "url",
      group: "tickets",
      hidden: ({ parent }) =>
        parent?.status === "soldOut" || parent?.status === "cancelled",
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "string",
      group: "tickets",
      description: 'Free text, e.g. "€12 / €8 reduced" or "Pay what you want".',
    }),
    defineField({
      name: "lineup",
      title: "Lineup",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "string" })],
      description: "Performer names, in running order.",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      group: "content",
      options: { hotspot: true },
      description: "Falls back to the show's image.",
      fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "blockContent",
      group: "content",
      description: "Falls back to the show's description.",
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
      group: "seo",
    }),
    defineField({
      name: "eventbriteId",
      title: "Eventbrite ID",
      type: "string",
      group: "tickets",
      readOnly: true,
      hidden: ({ value }) => !value,
      description: "Set when this event was imported from Eventbrite.",
    }),
  ],
  orderings: [
    {
      title: "Date, newest first",
      name: "startsAtDesc",
      by: [{ field: "startsAt", direction: "desc" }],
    },
    {
      title: "Date, oldest first",
      name: "startsAtAsc",
      by: [{ field: "startsAt", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      title: "title",
      showTitle: "show.title",
      startsAt: "startsAt",
      venue: "venue.name",
      status: "status",
      media: "image",
      showImage: "show.image",
    },
    prepare({ title, showTitle, startsAt, venue, status, media, showImage }) {
      const flag =
        status === "cancelled" ? "Cancelled" : status === "soldOut" ? "Sold out" : null;
      return {
        title: title || showTitle || "Untitled event",
        subtitle: [startsAt ? formatEventDate(startsAt) : "No date", venue, flag]
          .filter(Boolean)
          .join(" · "),
        media: media ?? showImage,
      };
    },
  },
});
