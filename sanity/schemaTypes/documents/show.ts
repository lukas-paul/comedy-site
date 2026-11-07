import { MicrophoneIcon } from "@sanity/icons/Microphone";
import { defineField, defineType } from "sanity";

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
    select: { title: "title", subtitle: "schedule", media: "image" },
  },
});
