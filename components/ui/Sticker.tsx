/** Round, slapped-on badge — think record-shop sticker. */
export function Sticker({
  children,
  tone = "ink",
  className = "",
}: {
  children: React.ReactNode;
  tone?: "ink" | "red" | "yellow";
  className?: string;
}) {
  const tones = {
    ink: "bg-ink text-paper",
    red: "bg-red text-ink",
    yellow: "bg-yellow text-ink",
  };

  return (
    <span
      className={`rough grid aspect-square place-items-center rounded-full p-4 text-center font-narrow text-lg leading-none font-black uppercase ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
