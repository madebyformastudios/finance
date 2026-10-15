"use client";

import { useState, useTransition } from "react";
import type { ActionResult } from "@/lib/actions";

// Runs a server action in a transition and keeps its error message for the UI.
export function useAction() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>, onSuccess?: () => void) {
    startTransition(async () => {
      const result = await action();
      setError(result.error ?? null);
      if (!result.error) onSuccess?.();
    });
  }

  return { run, isPending, error, setError };
}
