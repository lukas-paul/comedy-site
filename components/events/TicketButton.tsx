import type { EventStatus } from "@/sanity/lib/types";

/** Red rubber-stamp look for sold out / cancelled */
function Stamp({ children, large }: { children: React.ReactNode; large: boolean }) {
  return (
    <span
      className={`rough inline-block -rotate-6 border-[3px] border-red font-mono font-bold whitespace-nowrap text-red uppercase ${large ? "px-4 py-2 text-lg" : "px-2 py-1 text-sm"}`}
    >
      {children}
    </span>
  );
}

export function TicketButton({
  status,
  ticketUrl,
  size = "md",
}: {
  status: EventStatus;
  ticketUrl?: string | null;
  size?: "md" | "lg";
}) {
  const large = size === "lg";

  if (status === "soldOut") return <Stamp large={large}>Sold out</Stamp>;
  if (status === "cancelled") return <Stamp large={large}>Cancelled</Stamp>;

  if (ticketUrl) {
    return (
      <a
        href={ticketUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`btn-ink ${large ? "px-7 py-4 text-lg" : "px-4 py-2 text-sm"}`}
      >
        {status === "free" ? "Reserve" : "Tickets"} <span aria-hidden>→</span>
      </a>
    );
  }

  if (status === "free") {
    return (
      <span className="inline-block rotate-3 bg-yellow px-3 py-1 font-marker text-lg">
        free entry!
      </span>
    );
  }

  return null;
}
