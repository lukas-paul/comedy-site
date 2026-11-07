# Comedy collective site

Next.js (App Router) + an embedded Sanity Studio. The site exists to promote
events: a home page plus a subpage per show and per event. Forked from the
`sanity-next` scaffold with the page builder removed.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Sanity** (embedded Studio at `/studio`, Presentation tool for visual editing)
- **Tailwind CSS 4**
- **pnpm**

## Content model

- **Home page** (singleton) — hero headline/intro/image, about text, SEO
- **Show** — a recurring format (e.g. a monthly night): title, tagline,
  schedule text, image, description. Served at `/shows/<slug>`, lists its
  upcoming dates.
- **Event** — one date. References a show (optional — one-offs stand alone)
  and falls back to the show's title/image/description. Start + doors time,
  venue, status (on sale / free / sold out / cancelled), external ticket link,
  price text, lineup. Served at `/events/<slug>` with schema.org event JSON-LD.
- **Venue** — reusable address + map link.
- **Site settings** (singleton) — title, logo, footer and social links.

In the Studio, Events are split into Upcoming / Past, and each Show has a
"Dates" list where new events are pre-linked to that show.

### Time handling

Event times are stored in UTC and rendered in `NEXT_PUBLIC_SITE_TIMEZONE`
(default `Europe/Berlin`, see `lib/dates.ts`). Query results are cached until
content changes, so pages also re-render hourly (`revalidate = 3600`) and the
upcoming/past split happens in JS via `isUpcoming()` — events stay listed for
3 hours after they start.

## Setup

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Create a Sanity project** (this scaffold ships project-agnostic — no
   project is provisioned yet)

   ```bash
   pnpm dlx sanity@latest init
   ```

   Note the project ID and dataset name it gives you.

3. **Environment variables** — copy `.env.example` to `.env.local` and fill in:

   ```bash
   cp .env.example .env.local
   ```

   - `NEXT_PUBLIC_SANITY_PROJECT_ID` / `NEXT_PUBLIC_SANITY_DATASET` — from step 2
   - `SANITY_API_READ_TOKEN` — a token with **Viewer** access, created at
     [sanity.io/manage](https://www.sanity.io/manage) under your project's API
     settings. Used for draft mode and the Live Content API.

4. **Run it**

   ```bash
   pnpm dev
   ```

   - Site: [http://localhost:3000](http://localhost:3000)
   - Studio: [http://localhost:3000/studio](http://localhost:3000/studio)

5. In the Studio, fill in **Site settings** and **Home page**, add a
   **Venue**, a **Show**, and some **Events**.

## Preview / Visual editing

Draft Mode + Sanity's Presentation tool are wired up out of the box:

- `/api/draft-mode/enable` enables Draft Mode (used by the Presentation tool's
  preview iframe)
- `/api/draft-mode/disable` disables it
- Content updates stream live via Sanity's **Live Content API**
  (`sanity/lib/live.ts`) — no revalidation webhook is required.

Open the Presentation tool from the Studio sidebar to click-to-edit content
in context.

## Deployment

The app has no platform-specific code — it deploys to any host that runs a
Node.js Next.js server (Vercel, Netlify, Cloudflare, a VPS, etc.). Set the
same environment variables from `.env.local` on your host.

Crawlers are blocked (`/robots.txt` disallows everything) unless
`ALLOW_INDEXING=true` is set, so test deploys stay out of search engines. Set
it on the production site only.

Add the deployed URL as a CORS origin (with credentials) in Sanity, or the
embedded Studio can't log in:

```bash
pnpm dlx sanity cors add https://<your-site> --credentials
```

## Project structure

```
app/
  (site)/page.tsx               home: hero, upcoming events, shows, about
  (site)/shows/[slug]/          show page
  (site)/events/[slug]/         event page
  (site)/layout.tsx             header + footer + live/preview wiring
  studio/[[...tool]]/           embedded Sanity Studio
  api/draft-mode/               preview enable/disable routes
lib/dates.ts                    timezone-aware formatting, isUpcoming()
sanity/
  schemaTypes/documents/        home, event, show, venue, siteSettings
  schemaTypes/objects/          link, seo, blockContent, richTextImage
  lib/                          client, live query, image, queries, types
components/
  events/                       EventList, ShowCard, TicketButton
  layout/                       Header, Footer
  ui/                           CmsLink, SanityImage, PortableTextContent
```

After changing schemas or queries run `pnpm typegen`.
