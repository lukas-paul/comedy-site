import { PinIcon } from "@sanity/icons/Pin";
import { defineField, defineType } from "sanity";

import { LocationInput } from "../../components/LocationInput";

export const venue = defineType({
  name: "venue",
  title: "Venue",
  type: "document",
  icon: PinIcon,
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "address",
      title: "Street address",
      type: "string",
    }),
    defineField({
      name: "postalCode",
      title: "Postal code",
      type: "string",
    }),
    defineField({
      name: "city",
      title: "City",
      type: "string",
    }),
    defineField({
      name: "location",
      title: "Location",
      type: "geopoint",
      description: "Puts the venue on the site's map. Fill in the address, then look it up.",
      components: { input: LocationInput },
    }),
    defineField({
      name: "mapUrl",
      title: "Map link",
      type: "url",
      description: "e.g. a Google Maps or OpenStreetMap link.",
    }),
    defineField({
      name: "website",
      title: "Website",
      type: "url",
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "city" },
  },
});
