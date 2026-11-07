import { CogIcon } from "@sanity/icons/Cog";
import { defineArrayMember, defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  icon: CogIcon,
  fields: [
    defineField({
      name: "title",
      title: "Site title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Site description",
      type: "text",
      rows: 2,
      description: "Used as the default meta description.",
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
    }),
    defineField({
      name: "footerText",
      title: "Footer text",
      type: "string",
      description: "e.g. a copyright line. Leave empty to omit.",
    }),
    defineField({
      name: "footerLinks",
      title: "Footer links",
      type: "array",
      of: [defineArrayMember({ type: "link" })],
    }),
    defineField({
      name: "socialLinks",
      title: "Social links",
      type: "array",
      of: [defineArrayMember({ type: "link" })],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Site settings" };
    },
  },
});
