/**
 * The site mark: a stage mic on a tall stand with its cable trailing to the
 * floor, inside a ring. Black ink on paper.
 */
export function MicLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden
      focusable="false"
      className={`fill-ink stroke-ink ${className}`}
    >
      <circle cx={60} cy={60} r={56} strokeWidth={5} fill="none" />

      {/* Mic drawing, centred in the ring */}
      <g transform="translate(22.5 8.5)">
        {/* Cable: out of the mic, looping down past the stand to the floor */}
        <path
          d="M34 43 C44 48 44 60 37 66 S30 80 40 88 S54 94 61 92"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />

        {/* Stand: pole, clip and a heavy round base */}
        <path d="M32 42 V90" strokeWidth={4} strokeLinecap="round" fill="none" />
        <ellipse cx={32} cy={93} rx={18} ry={5} stroke="none" />
        <rect x={28} y={36} width={8} height={6} rx={1.5} stroke="none" />

        {/* Mic, tilted towards the audience */}
        <g transform="rotate(-14 32 40)" stroke="none">
          <path d="M26.5 24 H37.5 L35 40 H29 Z" />
          <rect x={25} y={21} width={14} height={4} rx={1.5} />
          <circle cx={32} cy={14} r={9.5} />
        </g>
      </g>
    </svg>
  );
}
