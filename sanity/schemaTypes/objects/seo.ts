import { SearchIcon } from "@sanity/icons/Search";
import { defineField, defineType } from "sanity";

export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  icon: SearchIcon,
  fields: [
    defineField({
      name: "metaTitle",
      title: "Meta title",
      type: "string",
      description: "Falls back to the page title if left empty.",
    }),
    defineField({
      name: "metaDescription",
      title: "Meta description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "ogImage",
      title: "Social share image",
      type: "image",
    }),
  ],
  options: {
    collapsible: true,
    collapsed: true,
  },
});
