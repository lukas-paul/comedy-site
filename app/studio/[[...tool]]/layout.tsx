import { NextStudioLayout } from "next-sanity/studio";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <NextStudioLayout>{children}</NextStudioLayout>;
}
