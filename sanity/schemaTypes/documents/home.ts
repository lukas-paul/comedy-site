import { HomeIcon } from "@sanity/icons/Home";
import { defineField, defineType } from "sanity";

export const home = defineType({
  name: "home",
  title: "Home page",
  type: "document",
  icon: HomeIcon,
  groups: [
    { name: "hero", title: "Hero", default: true },
    { name: "about", title: "About" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "headline",
      title: "Headline",
      type: "string",
      group: "hero",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "scribble",
      title: "Scribble",
      type: "string",
      group: "hero",
      description:
        'Short hand-written note next to the headline, e.g. "(not your dad\'s comedy club)".',
      validation: (rule) => rule.max(60),
    }),
    defineField({
      name: "intro",
      title: "Intro",
      type: "text",
      rows: 3,
      group: "hero",
    }),
    defineField({
      name: "heroImage",
      title: "Image",
      type: "image",
      group: "hero",
      options: { hotspot: true },
      fields: [defineField({ name: "alt", title: "Alt text", type: "string" })],
    }),
    defineField({
      name: "aboutHeading",
      title: "Heading",
      type: "string",
      group: "about",
      initialValue: "About us",
    }),
    defineField({
      name: "about",
      title: "Text",
      type: "blockContent",
      group: "about",
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "seo",
      group: "seo",
    }),
  ],
  preview: {
    prepare() {
      return { title: "Home page" };
    },
  },
});
