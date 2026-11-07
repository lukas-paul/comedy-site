import { DownloadIcon } from "@sanity/icons/Download";
import type { Tool } from "sanity";

import { EventbriteImportTool } from "./EventbriteImportTool";

export const eventbriteImportTool: Tool = {
  name: "eventbrite-import",
  title: "Eventbrite import",
  icon: DownloadIcon,
  component: EventbriteImportTool,
};
