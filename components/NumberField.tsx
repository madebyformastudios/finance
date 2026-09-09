"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";

export default function NumberField({
  label,
  value,
  onChange,
  onBlur,
  disabled,
  avatar,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  onBlur?: () => void;
  disabled?: boolean;
  avatar?: string;
}) {
  const [text, setText] = useState(value === 0 ? "" : String(value));

  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="flex items-center gap-2 text-muted">
        {avatar && <Avatar name={avatar} size={20} />}
        {label}
      </span>
      <input
        type="number"
        step="0.01"
        value={text}
        disabled={disabled}
        onChange={(e) => {
          setText(e.target.value);
          onChange(Number(e.target.value) || 0);
        }}
        onBlur={onBlur}
        className="rounded-xl border border-border bg-card px-3 py-2.5 text-ink outline-none transition focus:border-dominant disabled:bg-canvas disabled:text-muted"
      />
    </label>
  );
}
