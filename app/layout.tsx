import { Archivo, Permanent_Marker, Space_Mono } from "next/font/google";
import "./globals.css";

// Variable width axis: 62 (condensed) ... 125 (expanded) — see .font-wide /
// .font-narrow in globals.css
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

const marker = Permanent_Marker({
  variable: "--font-marker",
  subsets: ["latin"],
  weight: "400",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "700"],
});

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${marker.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
