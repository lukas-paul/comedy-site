import { CalendarIcon } from "@sanity/icons/Calendar";
import { CogIcon } from "@sanity/icons/Cog";
import { HomeIcon } from "@sanity/icons/Home";
import { MicrophoneIcon } from "@sanity/icons/Microphone";
import { PinIcon } from "@sanity/icons/Pin";
import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Home page")
        .icon(HomeIcon)
        .child(S.document().schemaType("home").documentId("home")),
      S.divider(),
      S.listItem()
        .title("Events")
        .icon(CalendarIcon)
        .child(
          S.list()
            .title("Events")
            .items([
              S.listItem()
                .title("Upcoming")
                .icon(CalendarIcon)
                .child(
                  S.documentTypeList("event")
                    .title("Upcoming events")
                    .filter('_type == "event" && dateTime(startsAt) >= dateTime(now())')
                    .defaultOrdering([{ field: "startsAt", direction: "asc" }])
                ),
              S.listItem()
                .title("Past")
                .icon(CalendarIcon)
                .child(
                  S.documentTypeList("event")
                    .title("Past events")
                    .filter('_type == "event" && dateTime(startsAt) < dateTime(now())')
                    .defaultOrdering([{ field: "startsAt", direction: "desc" }])
                ),
              S.divider(),
              S.listItem()
                .title("All events")
                .icon(CalendarIcon)
                .child(
                  S.documentTypeList("event")
                    .title("All events")
                    .defaultOrdering([{ field: "startsAt", direction: "desc" }])
                ),
            ])
        ),
      S.listItem()
        .title("Shows")
        .icon(MicrophoneIcon)
        .child(
          S.documentTypeList("show")
            .title("Shows")
            .child((showId) =>
              S.list()
                .title("Show")
                .items([
                  S.listItem()
                    .title("Details")
                    .icon(MicrophoneIcon)
                    .child(S.document().schemaType("show").documentId(showId)),
                  S.listItem()
                    .title("Dates")
                    .icon(CalendarIcon)
                    .child(
                      S.documentTypeList("event")
                        .title("Dates")
                        .filter('_type == "event" && show._ref == $showId')
                        .params({ showId })
                        .defaultOrdering([{ field: "startsAt", direction: "desc" }])
                        .initialValueTemplates([
                          S.initialValueTemplateItem("event-for-show", { showId }),
                        ])
                    ),
                ])
            )
        ),
      S.listItem()
        .title("Venues")
        .icon(PinIcon)
        .child(S.documentTypeList("venue").title("Venues")),
      S.divider(),
      S.listItem()
        .title("Site settings")
        .icon(CogIcon)
        .child(
          S.document().schemaType("siteSettings").documentId("siteSettings")
        ),
    ]);
