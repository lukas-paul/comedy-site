import { defineQuery } from "next-sanity";

const linkFields = /* groq */ `
  _key,
  label,
  linkType,
  openInNewTab,
  externalUrl,
  internalLink->{ _type, "slug": slug.current }
`;

const blockContentFields = /* groq */ `
  ...,
  _type == "richTextImage" => {
    ...,
    asset->
  }
`;

// Pages re-render hourly (see `revalidate` in the routes) but sanityFetch
// caches query results until content changes, so `now()` here can be stale.
// Only use it to trim old events with a generous margin, and do the exact
// upcoming/past split in JS with `isUpcoming()`.
const recentEventsFilter = /* groq */ `
  _type == "event"
  && defined(slug.current)
  && defined(startsAt)
  && dateTime(startsAt) > dateTime(now()) - 60 * 60 * 24 * 7
`;

const eventCardFields = /* groq */ `
  _id,
  "title": coalesce(title, show->title),
  "slug": slug.current,
  startsAt,
  status,
  ticketUrl,
  price,
  "image": coalesce(image, show->image),
  venue->{ _id, name, address, city, location },
  show->{ title, "slug": slug.current, showType }
`;

export const HOME_QUERY = defineQuery(/* groq */ `
  *[_type == "home" && _id == "home"][0]{
    _id,
    _type,
    headline,
    scribble,
    intro,
    heroImage,
    aboutHeading,
    about[]{ ${blockContentFields} },
    seo
  }
`);

export const UPCOMING_EVENTS_QUERY = defineQuery(/* groq */ `
  *[${recentEventsFilter}] | order(startsAt asc) { ${eventCardFields} }
`);

export const SHOWS_QUERY = defineQuery(/* groq */ `
  *[_type == "show" && defined(slug.current)]
    | order(coalesce(order, 9999) asc, title asc) {
      _id,
      title,
      "slug": slug.current,
      showType,
      tagline,
      schedule,
      image,
      "dates": *[${recentEventsFilter} && show._ref == ^._id && status != "cancelled"]
        | order(startsAt asc).startsAt
    }
`);

export const SHOW_QUERY = defineQuery(/* groq */ `
  *[_type == "show" && slug.current == $slug][0]{
    _id,
    _type,
    title,
    "slug": slug.current,
    showType,
    tagline,
    schedule,
    image,
    description[]{ ${blockContentFields} },
    seo,
    "events": *[${recentEventsFilter} && show._ref == ^._id]
      | order(startsAt asc) { ${eventCardFields} }
  }
`);

export const SHOW_SLUGS_QUERY = defineQuery(/* groq */ `
  *[_type == "show" && defined(slug.current)].slug.current
`);

export const EVENT_QUERY = defineQuery(/* groq */ `
  *[_type == "event" && slug.current == $slug][0]{
    _id,
    _type,
    "title": coalesce(title, show->title),
    "slug": slug.current,
    startsAt,
    doorsAt,
    status,
    ticketUrl,
    price,
    lineup,
    "image": coalesce(image, show->image),
    "description": coalesce(description, show->description)[]{ ${blockContentFields} },
    venue->{ name, address, postalCode, city, mapUrl, website },
    show->{ title, "slug": slug.current, showType, tagline, schedule },
    seo
  }
`);

export const EVENT_SLUGS_QUERY = defineQuery(/* groq */ `
  *[${recentEventsFilter}].slug.current
`);

export const SITE_SETTINGS_QUERY = defineQuery(/* groq */ `
  *[_type == "siteSettings"][0]{
    title,
    description,
    logo,
    footerText,
    footerLinks[]{ ${linkFields} },
    socialLinks[]{ ${linkFields} }
  }
`);
