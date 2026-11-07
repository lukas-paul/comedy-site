import { defineField, defineType } from "sanity";

export const richTextImage = defineType({
  name: "richTextImage",
  title: "Image",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
      description: "Important for accessibility and SEO.",
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string",
    }),
  ],
});
