export function SectionHeading({
  children,
  note,
  count,
}: {
  children: React.ReactNode;
  /** Hand-written aside next to the heading */
  note?: string;
  count?: number;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end gap-x-5 gap-y-1">
      <h2 className="font-wide text-5xl leading-[0.85] font-black uppercase sm:text-7xl">
        {children}
      </h2>
      {count !== undefined && (
        <span className="font-mono text-lg font-bold">({String(count).padStart(2, "0")})</span>
      )}
      {note && <span className="-rotate-3 font-marker text-xl text-red">{note}</span>}
    </div>
  );
}
