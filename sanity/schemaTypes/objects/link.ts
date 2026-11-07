import { LinkIcon } from "@sanity/icons/Link";
import { defineField, defineType } from "sanity";

export const link = defineType({
  name: "link",
  title: "Link",
  type: "object",
  icon: LinkIcon,
  fields: [
    defineField({
      name: "label",
      title: "Label",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "linkType",
      title: "Link type",
      type: "string",
      options: {
        list: [
          { title: "Page on this site", value: "internal" },
          { title: "External URL", value: "external" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "internalLink",
      title: "Page",
      type: "reference",
      to: [{ type: "home" }, { type: "show" }, { type: "event" }],
      hidden: ({ parent }) => parent?.linkType !== "internal",
    }),
    defineField({
      name: "externalUrl",
      title: "URL",
      type: "url",
      hidden: ({ parent }) => parent?.linkType !== "external",
      validation: (rule) =>
        rule.uri({ scheme: ["http", "https", "mailto", "tel"] }),
    }),
    defineField({
      name: "openInNewTab",
      title: "Open in new tab",
      type: "boolean",
    }),
  ],
  preview: {
    select: {
      title: "label",
      linkType: "linkType",
      externalUrl: "externalUrl",
      internalTitle: "internalLink.title",
      internalType: "internalLink._type",
    },
    prepare({ title, linkType, externalUrl, internalTitle, internalType }) {
      return {
        title: title || "Untitled link",
        subtitle:
          linkType === "external"
            ? externalUrl
            : internalType === "home"
              ? "Home page"
              : internalTitle || "No page selected",
      };
    },
  },
});
