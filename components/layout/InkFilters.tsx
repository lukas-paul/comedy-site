/** SVG filters referenced from CSS (`.rough`). Render once per page. */
export function InkFilters() {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <filter id="rough">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="3" />
        <feDisplacementMap in="SourceGraphic" scale="3" />
      </filter>
    </svg>
  );
}
