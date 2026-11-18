import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Flex,
  Heading,
  Select,
  Spinner,
  Stack,
  Text,
  TextInput,
} from "@sanity/ui";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useClient } from "sanity";
import { IntentLink } from "sanity/router";

import { formatEventDate } from "../../../lib/dates";
import type { EventbriteEvent } from "../../../lib/eventbrite";
import { apiVersion } from "../../env";
import { type ImportResult, importEvents } from "./importEvents";

type Show = { _id: string; title?: string };
type Existing = { _id: string; eventbriteId?: string; startsAt?: string; title?: string };
type Preview = {
  events: EventbriteEvent[];
  errors: { eventbriteId: string; message: string }[];
};

const STATUS_LABEL: Record<EventbriteEvent["status"], string> = {
  onSale: "On sale",
  free: "Free",
  soldOut: "Sold out",
  cancelled: "Cancelled",
};

const publishedId = (id: string) => id.replace(/^drafts\./, "");

const DEFAULT_MAX_IMPORT = "10";

/** "10" → 10; empty, zero or junk → no limit */
function parseLimit(value: string) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : Infinity;
}

/**
 * The soonest events worth importing: not imported yet and not cancelled.
 * Events arrive sorted by start time.
 */
function soonestImportable(events: EventbriteEvent[], imported: Set<string>, limit: number) {
  return new Set(
    events
      .filter((ev) => !imported.has(ev.eventbriteId) && ev.status !== "cancelled")
      .slice(0, limit)
      .map((ev) => ev.eventbriteId)
  );
}

export function EventbriteImportTool() {
  const client = useClient({ apiVersion });

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [existing, setExisting] = useState<Existing[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [shows, setShows] = useState<Show[]>([]);
  const [showId, setShowId] = useState("");
  const [includeContent, setIncludeContent] = useState(true);
  // Some shows list a whole year of dates; import a batch at a time.
  const [maxImport, setMaxImport] = useState(DEFAULT_MAX_IMPORT);
  const limit = parseLimit(maxImport);

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[] | null>(null);

  useEffect(() => {
    client
      .fetch<Show[]>(`*[_type == "show" && !(_id in path("drafts.**"))]{ _id, title } | order(title asc)`)
      .then(setShows, () => setShows([]));
  }, [client]);

  // Already imported (by Eventbrite ID, drafts included), and events at the
  // same time that were probably entered by hand.
  const importedAs = useMemo(() => {
    const map = new Map<string, string>();
    for (const doc of existing) {
      if (doc.eventbriteId) map.set(doc.eventbriteId, publishedId(doc._id));
    }
    return map;
  }, [existing]);

  // Same start time but a different (or no) Eventbrite ID: entered by hand,
  // or imported earlier from the series itself rather than this exact date.
  const possibleDuplicate = (event: EventbriteEvent) =>
    existing.find(
      (doc) =>
        doc.eventbriteId !== event.eventbriteId &&
        doc.startsAt &&
        new Date(doc.startsAt).getTime() === new Date(event.startsAt).getTime()
    );

  async function loadEvents(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPreview(null);
    setResults(null);
    try {
      const token = client.config().token;
      if (!token) {
        throw new Error("Your Studio session has no login token. Please log out and in again.");
      }
      const res = await fetch(`/api/eventbrite/preview?url=${encodeURIComponent(url.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({ error: `Request failed (${res.status})` }));
      if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
      const data = body as Preview;

      const docs = await client.fetch<Existing[]>(
        `*[_type == "event" && (eventbriteId in $ids || startsAt in $times)]{ _id, eventbriteId, startsAt, title }`,
        {
          ids: data.events.map((ev) => ev.eventbriteId),
          times: data.events.map((ev) => ev.startsAt),
        }
      );
      const imported = new Set(
        docs.map((d) => d.eventbriteId).filter((id): id is string => Boolean(id))
      );

      setExisting(docs);
      setPreview(data);
      setSelected(soonestImportable(data.events, imported, limit));
      // Preselect the show whose name appears in the event titles.
      const firstTitle = data.events[0]?.title.toLowerCase() ?? "";
      const match = shows.find((s) => s.title && firstTitle.includes(s.title.toLowerCase()));
      setShowId(match?._id ?? "");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function runImport() {
    if (!preview) return;
    const toImport = preview.events.filter((ev) => selected.has(ev.eventbriteId));
    setImporting(true);
    setProgress(0);
    setResults(null);
    try {
      const res = await importEvents(
        client,
        toImport,
        { showId: showId || undefined, includeContent },
        setProgress
      );
      setResults(res);
      const done = res.flatMap((r) => (r.ok ? [r] : []));
      setExisting((prev) => [
        ...prev,
        ...done.map((r) => ({ _id: r.documentId, eventbriteId: r.eventbriteId })),
      ]);
      setSelected(new Set());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setImporting(false);
    }
  }

  function changeLimit(value: string) {
    setMaxImport(value);
    if (preview) {
      setSelected(
        soonestImportable(preview.events, new Set(importedAs.keys()), parseLimit(value))
      );
    }
  }

  function toggle(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const selectable = preview?.events.filter((ev) => !importedAs.has(ev.eventbriteId)) ?? [];
  const atLimit = selected.size >= limit;
  const seriesDates = preview?.events.filter((ev) => ev.seriesId).length ?? 0;
  const allSelected =
    selectable.length > 0 && selected.size >= Math.min(limit, selectable.length);

  return (
    <Container width={2} paddingX={4} paddingY={5}>
      <Stack gap={5}>
        <Stack gap={3}>
          <Heading as="h1" size={3}>
            Import from Eventbrite
          </Heading>
          <Text muted size={2}>
            Paste an organizer page (…/o/…) or a single event (…/e/…). Imported events are
            saved as drafts, so you can check them before publishing.
          </Text>
        </Stack>

        <form onSubmit={loadEvents}>
          <Flex gap={2}>
            <Box flex={1}>
              <TextInput
                value={url}
                onChange={(e) => setUrl(e.currentTarget.value)}
                placeholder="https://www.eventbrite.de/o/riff-city-121190972731"
                disabled={loading || importing}
                aria-label="Eventbrite link"
              />
            </Box>
            <Button
              type="submit"
              text="Load events"
              tone="primary"
              disabled={!url.trim() || loading || importing}
            />
          </Flex>
        </form>

        {loading && (
          <Flex align="center" gap={3}>
            <Spinner muted />
            <Text muted size={1}>
              Reading Eventbrite…
            </Text>
          </Flex>
        )}

        {error && (
          <Card padding={3} radius={2} tone="critical" border>
            <Text size={1}>{error}</Text>
          </Card>
        )}

        {preview && (
          <Stack gap={4}>
            <Card padding={3} radius={2} border>
              <Stack gap={3}>
                <Flex align="center" gap={3} wrap="wrap">
                  <Box flex={1} style={{ minWidth: 200 }}>
                    <Stack gap={2}>
                      <Text size={1} weight="medium">
                        Show
                      </Text>
                      <Select value={showId} onChange={(e) => setShowId(e.currentTarget.value)}>
                        <option value="">No show (one-off events)</option>
                        {shows.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.title || "Untitled show"}
                          </option>
                        ))}
                      </Select>
                    </Stack>
                  </Box>
                  <Box style={{ width: 160 }}>
                    <Stack gap={2}>
                      <Text size={1} weight="medium">
                        Import at most
                      </Text>
                      <TextInput
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={maxImport}
                        onChange={(e) => changeLimit(e.currentTarget.value)}
                        placeholder="No limit"
                        disabled={importing}
                        aria-describedby="max-import-help"
                      />
                    </Stack>
                  </Box>
                </Flex>
                <Text id="max-import-help" size={1} muted>
                  The soonest events are picked first. Leave empty to allow all.
                </Text>
                <Flex as="label" align="center" gap={2}>
                  <Checkbox
                    checked={includeContent}
                    onChange={(e) => setIncludeContent(e.currentTarget.checked)}
                  />
                  <Text size={1}>
                    Copy image and description from Eventbrite
                    {showId ? " (otherwise the show's are used)" : ""}
                  </Text>
                </Flex>
              </Stack>
            </Card>

            <Flex align="center" justify="space-between">
              <Flex as="label" align="center" gap={2}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={!allSelected && selected.size > 0}
                  disabled={selectable.length === 0}
                  onChange={(e) => {
                    const on = e.currentTarget.checked;
                    setSelected(
                      on
                        ? new Set(selectable.slice(0, limit).map((ev) => ev.eventbriteId))
                        : new Set()
                    );
                  }}
                />
                <Text size={1} weight="medium">
                  {preview.events.length} event{preview.events.length === 1 ? "" : "s"} found
                  {seriesDates > 0 &&
                    ` (${seriesDates === preview.events.length ? "all" : seriesDates} from recurring series)`}
                  {Number.isFinite(limit) && selectable.length > limit
                    ? ` · at most ${limit} per import`
                    : ""}
                </Text>
              </Flex>
              <Button
                text={
                  importing
                    ? `Importing ${progress}/${selected.size}…`
                    : `Import ${selected.size} event${selected.size === 1 ? "" : "s"}`
                }
                tone="positive"
                disabled={selected.size === 0 || importing}
                onClick={runImport}
              />
            </Flex>

            <Stack gap={2}>
              {preview.events.map((ev) => {
                const docId = importedAs.get(ev.eventbriteId);
                const duplicate = !docId ? possibleDuplicate(ev) : undefined;
                const failed = results?.find((r) => r.eventbriteId === ev.eventbriteId && !r.ok);
                return (
                  <Card
                    key={ev.eventbriteId}
                    padding={3}
                    radius={2}
                    border
                    tone={docId ? "transparent" : selected.has(ev.eventbriteId) ? "primary" : "default"}
                  >
                    <Flex gap={3} align="flex-start">
                      <Box paddingTop={1}>
                        <Checkbox
                          checked={!docId && selected.has(ev.eventbriteId)}
                          disabled={
                            Boolean(docId) ||
                            importing ||
                            (atLimit && !selected.has(ev.eventbriteId))
                          }
                          onChange={(e) => toggle(ev.eventbriteId, e.currentTarget.checked)}
                          aria-label={`Import ${ev.title}`}
                        />
                      </Box>
                      <Stack gap={2} flex={1}>
                        <Flex gap={2} align="center" wrap="wrap">
                          <Text size={1} weight="semibold">
                            {formatEventDate(ev.startsAt)}
                          </Text>
                          <Badge tone={ev.status === "cancelled" ? "critical" : ev.status === "soldOut" ? "caution" : "default"}>
                            {STATUS_LABEL[ev.status]}
                          </Badge>
                          {ev.seriesId && <Badge tone="primary">Recurring</Badge>}
                          {docId && (
                            <Badge tone="positive">
                              <IntentLink intent="edit" params={{ id: docId, type: "event" }}>
                                Already imported
                              </IntentLink>
                            </Badge>
                          )}
                        </Flex>
                        <Text size={2}>{ev.title}</Text>
                        <Text size={1} muted>
                          {[
                            ev.venue?.name,
                            ev.price,
                            ev.lineup.length ? `${ev.lineup.length} performers` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </Text>
                        {duplicate && (
                          <Text size={1}>
                            ⚠️ There&apos;s already an event at this time:{" "}
                            <IntentLink
                              intent="edit"
                              params={{ id: publishedId(duplicate._id), type: "event" }}
                            >
                              {duplicate.title || "Untitled event"}
                            </IntentLink>
                          </Text>
                        )}
                        {failed && !failed.ok && (
                          <Text size={1}>❌ {failed.message}</Text>
                        )}
                      </Stack>
                    </Flex>
                  </Card>
                );
              })}
            </Stack>

            {preview.errors.length > 0 && (
              <Card padding={3} radius={2} tone="caution" border>
                <Text size={1}>
                  {preview.errors.length} event(s) couldn&apos;t be read from Eventbrite:{" "}
                  {preview.errors.map((e) => e.eventbriteId).join(", ")}
                </Text>
              </Card>
            )}

            {results && (
              <Card padding={3} radius={2} tone="positive" border>
                <Text size={1}>
                  Imported {results.filter((r) => r.ok).length} of {results.length} as drafts.
                  Open them from the list above, or under Events → Upcoming, to review and
                  publish.
                </Text>
              </Card>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
