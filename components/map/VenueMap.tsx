"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useRef } from "react";

import { distanceInMetres, type LatLng, type MapVenue } from "@/lib/geo";

// Leaflet touches `window` on import, so this module must only be loaded on
// the client — see the `dynamic(..., { ssr: false })` in MapSection.

// OpenStreetMap's standard tiles, tinted to newsprint in globals.css. Fine
// for a small site under OSM's tile usage policy; for heavy traffic, swap
// in a commercial provider here.
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Fallback view when there's nothing to fit (Berlin).
const DEFAULT_CENTER: L.LatLngTuple = [52.52, 13.405];

export default function VenueMap({
  venues,
  interactive = true,
  selectedId = null,
  onSelect,
  user = null,
}: {
  venues: MapVenue[];
  /** false for the static preview: no panning, zooming or marker clicks */
  interactive?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** The visitor's position, once they've shared it */
  user?: LatLng | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const userLayerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Create the map once.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = L.map(el, {
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
      touchZoom: interactive,
      attributionControl: true,
    });
    map.attributionControl.setPrefix(false);
    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    userLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    fitVenues(map, venues);

    // The modal can resize (rotation, window resize); keep tiles filling it.
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(el);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // Venues only set the initial view; later changes are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  // Re-frame when the set of venues changes (e.g. a show-type filter). With
  // no venues left, keep the current view rather than jumping elsewhere.
  const venueKey = venues.map((v) => v.id).join(",");
  const fittedKeyRef = useRef(venueKey);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || fittedKeyRef.current === venueKey) return;
    fittedKeyRef.current = venueKey;
    if (venues.length > 0) fitVenues(map, venues, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueKey]);

  // Venue markers.
  useEffect(() => {
    const layer = markersRef.current;
    if (!layer) return;
    layer.clearLayers();

    for (const venue of venues) {
      const selected = venue.id === selectedId;
      const marker = L.marker([venue.lat, venue.lng], {
        icon: venueIcon(venue.events.length, selected),
        title: venue.name,
        alt: venue.name,
        keyboard: interactive,
        interactive,
        riseOnHover: true,
        zIndexOffset: selected ? 1000 : 0,
      });
      if (interactive) {
        marker.bindTooltip(escapeHtml(venue.name), {
          direction: "top",
          offset: [0, -22],
          className: "map-tooltip",
        });
        marker.on("click", () => onSelectRef.current?.(venue.id));
      }
      marker.addTo(layer);
    }
  }, [venues, selectedId, interactive]);

  // Fly to the selected venue.
  useEffect(() => {
    const map = mapRef.current;
    const venue = venues.find((v) => v.id === selectedId);
    if (!map || !venue) return;
    map.flyTo([venue.lat, venue.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [selectedId, venues]);

  // The visitor's own position: mark it, then frame them with the closest venues.
  useEffect(() => {
    const map = mapRef.current;
    const layer = userLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    if (!user) return;

    L.marker([user.lat, user.lng], {
      icon: L.divIcon({
        className: "",
        html: '<span class="map-you" aria-hidden="true"></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
      title: "You are here",
      alt: "You are here",
      interactive: false,
      keyboard: false,
    }).addTo(layer);

    const nearest = [...venues]
      .sort((a, b) => distanceInMetres(user, a) - distanceInMetres(user, b))
      .slice(0, 3);
    const bounds = L.latLngBounds([[user.lat, user.lng]]);
    nearest.forEach((v) => bounds.extend([v.lat, v.lng]));
    map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 15, duration: 0.8 });
  }, [user, venues]);

  return <div ref={containerRef} className="venue-map isolate h-full w-full" />;
}

function fitVenues(map: L.Map, venues: MapVenue[], animate = false) {
  if (venues.length === 0) {
    map.setView(DEFAULT_CENTER, 12);
  } else if (venues.length === 1) {
    map.setView([venues[0].lat, venues[0].lng], 15, { animate });
  } else {
    map.fitBounds(
      venues.map((v) => [v.lat, v.lng] as L.LatLngTuple),
      { padding: [40, 40], maxZoom: 15, animate }
    );
  }
}

/** Round sticker pin with the number of upcoming dates at that venue. */
function venueIcon(count: number, selected: boolean) {
  return L.divIcon({
    className: "",
    html: `<span class="map-pin${selected ? " is-selected" : ""}">${count}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}
