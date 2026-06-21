import { cn } from "@/lib/utils";

type MiniSparklineProps = {
  seed: number;
  variant?: "default" | "warning" | "danger" | "success" | "accent";
  className?: string;
};

function generatePoints(seed: number, count = 14): number[] {
  const points: number[] = [];
  let value = 0.35 + (seed % 7) * 0.04;
  for (let i = 0; i < count; i++) {
    const wave = Math.sin((seed + i) * 0.85) * 0.12;
    const drift = ((seed * (i + 1)) % 5) * 0.02 - 0.04;
    value = Math.min(0.92, Math.max(0.08, value + wave + drift));
    points.push(value);
  }
  return points;
}

const strokeVariants = {
  default: "stroke-foreground/40",
  warning: "stroke-status-low-foreground/70",
  danger: "stroke-status-out-foreground/70",
  success: "stroke-status-healthy-foreground/70",
  accent: "stroke-accent-brand/80",
};

const fillVariants = {
  default: "fill-foreground/5",
  warning: "fill-status-low-foreground/10",
  danger: "fill-status-out-foreground/10",
  success: "fill-status-healthy-foreground/10",
  accent: "fill-accent-brand/15",
};

export function MiniSparkline({
  seed,
  variant = "default",
  className,
}: MiniSparklineProps) {
  const points = generatePoints(seed);
  const width = 80;
  const height = 28;
  const step = width / (points.length - 1);

  const linePath = points
    .map((y, i) => {
      const x = i * step;
      const py = height - y * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");

  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-7 w-20 shrink-0", className)}
      aria-hidden
    >
      <path d={areaPath} className={fillVariants[variant]} />
      <path
        d={linePath}
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={strokeVariants[variant]}
      />
    </svg>
  );
}
