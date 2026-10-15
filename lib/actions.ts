// Shared bits for server actions. Next.js hides the message of an error thrown
// from a server action in production, so actions return { error } instead and
// the UI shows it.

export interface ActionResult {
  error?: string;
}

// numeric(12, 2) holds up to 9,999,999,999.99.
export function isMoney(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && Math.abs(n) < 1e10;
}

export function actionError(error: { code?: string; message: string }): ActionResult {
  console.error("Server action failed:", error.code, error.message);
  // 42501 = row-level security refused the write: the month is locked.
  if (error.code === "42501") return { error: "Deze maand is vergrendeld." };
  // 23514 = check constraint: a negative savings balance or an invalid amount.
  if (error.code === "23514") return { error: "Ongeldig bedrag of onvoldoende saldo." };
  return { error: "Opslaan mislukt. Probeer het opnieuw." };
}

export const INVALID_INPUT: ActionResult = { error: "Ongeldige invoer." };
