import type {
  EVENT_QUERY_RESULT,
  HOME_QUERY_RESULT,
  SHOW_QUERY_RESULT,
  SHOWS_QUERY_RESULT,
  SITE_SETTINGS_QUERY_RESULT,
  UPCOMING_EVENTS_QUERY_RESULT,
} from "@/sanity.types";

export type HomeData = NonNullable<HOME_QUERY_RESULT>;
export type ShowData = NonNullable<SHOW_QUERY_RESULT>;
export type EventData = NonNullable<EVENT_QUERY_RESULT>;

export type EventCardData = UPCOMING_EVENTS_QUERY_RESULT[number];
export type ShowCardData = SHOWS_QUERY_RESULT[number];
export type EventStatus = EventCardData["status"];

export type RichText = NonNullable<HomeData["about"]>;
export type RichTextImage = Extract<RichText[number], { _type: "richTextImage" }>;

export type SiteSettings = NonNullable<SITE_SETTINGS_QUERY_RESULT>;
export type Link = NonNullable<SiteSettings["footerLinks"]>[number];
