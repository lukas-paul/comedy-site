import { defineType, defineArrayMember } from "sanity";

export const blockContent = defineType({
  name: "blockContent",
  title: "Text",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "H2", value: "h2" },
        { title: "H3", value: "h3" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bullet", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
        ],
        annotations: [
          {
            name: "link",
            title: "Link",
            type: "object",
            fields: [
              {
                name: "href",
                title: "URL",
                type: "url",
                validation: (rule) =>
                  rule.uri({ scheme: ["http", "https", "mailto", "tel"] }),
              },
              {
                name: "openInNewTab",
                title: "Open in new tab",
                type: "boolean",
                initialValue: false,
              },
            ],
          },
        ],
      },
    }),
    defineArrayMember({ type: "richTextImage" }),
  ],
});
