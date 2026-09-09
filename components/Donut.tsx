"use client";

import { useEffect, useState } from "react";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export default function Donut({
  segments,
  size = 168,
  strokeWidth = 20,
}: {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, seg) => sum + seg.value, 0) || 1;

  const fractions = segments.map((seg) => seg.value / total);
  const cumulativeFractions = fractions.map((_, i) => fractions.slice(0, i).reduce((sum, f) => sum + f, 0));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={strokeWidth}
      />
      {segments.map((seg, i) => {
        const length = fractions[i] * circumference;
        const dashOffset = -cumulativeFractions[i] * circumference;

        return (
          <circle
            key={seg.label}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={mounted ? `${length} ${circumference - length}` : `0 ${circumference}`}
            strokeDashoffset={dashOffset}
            style={{
              transition: `stroke-dasharray 750ms cubic-bezier(0.4, 0, 0.2, 1) ${i * 180}ms`,
            }}
          />
        );
      })}
    </svg>
  );
}
