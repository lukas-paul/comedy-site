// Show formats. Shared by the Studio (field options) and the site (labels,
// filters). Values are stored in Sanity, so don't rename them — change the
// titles instead.
export const SHOW_TYPES = [
  { value: "openMic", title: "Open Mic" },
  { value: "showcase", title: "Show Case" },
  { value: "showUpSignUp", title: "Show up Sign up" },
  { value: "solo", title: "Solo" },
  { value: "themeShow", title: "Theme Show" },
] as const;

export type ShowType = (typeof SHOW_TYPES)[number]["value"];

export function showTypeTitle(value: string | null | undefined) {
  return SHOW_TYPES.find((t) => t.value === value)?.title;
}
