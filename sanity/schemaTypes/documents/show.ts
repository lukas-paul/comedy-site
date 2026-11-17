import { MicrophoneIcon } from "@sanity/icons/Microphone";
import { defineField, defineType } from "sanity";

import { SHOW_TYPES, showTypeTitle } from "../../../lib/showTypes";

export const show = defineType({
  name: "show",
  title: "Show",
  type: "document",
  icon: MicrophoneIcon,
  description: "A recurring format. Its dates are Event documents that reference it.",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      description: "Served at /shows/<slug>.",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "showType",
      title: "Show type",
      type: "string",
      description: "The format. Visitors can filter by it.",
      options: { list: SHOW_TYPES.map(({ value, title }) => ({ value, title })), layout: "radio" },
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
      description: "One line, shown on cards and under the title.",
    }),
    defineField({
      name: "schedule",
      title: "Schedule",
      type: "string",
      description: 'Human-readable rhythm, e.g. "Every first Friday".',
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "blockContent",
    }),
    defineField({
      name: "order",
      title: "Order on home page",
      type: "number",
      description: "Lower numbers appear first. Leave blank to sort last.",
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
    }),
  ],
  preview: {
    select: { title: "title", schedule: "schedule", showType: "showType", media: "image" },
    prepare({ title, schedule, showType, media }) {
      return {
        title,
        subtitle: [showTypeTitle(showType), schedule].filter(Boolean).join(" · "),
        media,
      };
    },
  },
});
