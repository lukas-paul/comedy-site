import { Button, Card, Flex, Stack, Text, TextInput } from "@sanity/ui";
import { type ChangeEvent, useCallback, useState } from "react";
import {
  type ObjectInputProps,
  set,
  unset,
  useFormValue,
} from "sanity";

import { geocodeVenue } from "../lib/geocode";

type Geopoint = { _type: "geopoint"; lat?: number; lng?: number };

/**
 * Lat/lng fields for a venue, plus a button that looks the coordinates up
 * from the venue's address via OpenStreetMap's Nominatim geocoder. Used
 * instead of the Google Maps plugin so no API key is needed.
 */
export function LocationInput(props: ObjectInputProps<Geopoint>) {
  const { value, onChange, readOnly } = props;
  const name = useFormValue(["name"]) as string | undefined;
  const address = useFormValue(["address"]) as string | undefined;
  const postalCode = useFormValue(["postalCode"]) as string | undefined;
  const city = useFormValue(["city"]) as string | undefined;

  const [status, setStatus] = useState<{ tone: "critical" | "positive"; text: string }>();
  const [loading, setLoading] = useState(false);

  const setPoint = useCallback(
    (lat: number | undefined, lng: number | undefined) => {
      if (lat === undefined && lng === undefined) return onChange(unset());
      onChange(set({ _type: "geopoint", lat, lng }));
    },
    [onChange]
  );

  const onNumber = (key: "lat" | "lng") => (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value.trim().replace(",", ".");
    const num = raw === "" ? undefined : Number(raw);
    if (num !== undefined && Number.isNaN(num)) return;
    const next = { lat: value?.lat, lng: value?.lng, [key]: num };
    setPoint(next.lat, next.lng);
  };

  const lookup = async () => {
    if (!address || !city) {
      setStatus({ tone: "critical", text: "Fill in the street address and city first." });
      return;
    }
    setLoading(true);
    setStatus(undefined);
    try {
      const results = await geocodeVenue({ name, address, postalCode, city });
      if (!results) {
        setStatus({ tone: "critical", text: "No match found. Enter the coordinates by hand." });
        return;
      }
      setPoint(results.lat, results.lng);
      setStatus({ tone: "positive", text: `Found: ${results.label}` });
    } catch {
      setStatus({ tone: "critical", text: "Lookup failed. Try again in a moment." });
    } finally {
      setLoading(false);
    }
  };

  const hasPoint = value?.lat !== undefined && value?.lng !== undefined;

  return (
    <Stack gap={3}>
      <Flex gap={2}>
        <Stack gap={2} flex={1}>
          <Text size={1} weight="medium">Latitude</Text>
          <TextInput
            inputMode="decimal"
            value={value?.lat ?? ""}
            onChange={onNumber("lat")}
            readOnly={readOnly}
            placeholder="52.4870"
          />
        </Stack>
        <Stack gap={2} flex={1}>
          <Text size={1} weight="medium">Longitude</Text>
          <TextInput
            inputMode="decimal"
            value={value?.lng ?? ""}
            onChange={onNumber("lng")}
            readOnly={readOnly}
            placeholder="13.4250"
          />
        </Stack>
      </Flex>
      <Flex gap={2} wrap="wrap">
        <Button
          text="Look up from address"
          mode="ghost"
          onClick={lookup}
          loading={loading}
          disabled={readOnly}
        />
        {hasPoint && (
          <Button
            as="a"
            href={`https://www.openstreetmap.org/?mlat=${value.lat}&mlon=${value.lng}#map=17/${value.lat}/${value.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            text="Check on map ↗"
            mode="bleed"
          />
        )}
      </Flex>
      {status && (
        <Card padding={3} radius={2} tone={status.tone}>
          <Text size={1}>{status.text}</Text>
        </Card>
      )}
    </Stack>
  );
}

