const PALETTE: Record<string, { bg: string; fg: string }> = {
  Jairo: { bg: "#1f3d33", fg: "#eef1ec" },
  Naroa: { bg: "#d19a3d", fg: "#4a3410" },
  Gezamenlijk: { bg: "#6b6252", fg: "#fffdf8" },
};

export default function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.slice(0, 2).toUpperCase();
  const colors = PALETTE[name] ?? { bg: "#6b6252", fg: "#fffdf8" };

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: colors.bg,
        color: colors.fg,
        fontSize: size * 0.38,
      }}
      title={name}
    >
      {initials}
    </span>
  );
}
