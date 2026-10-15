// "Today's" month in the couple's time zone. The server runs in UTC, which is
// still the previous day for the first hours after midnight in the Netherlands.
export function currentMonth(now: Date = new Date()): { month: number; year: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Amsterdam",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { month: get("month"), year: get("year") };
}

// Reads ?month=&year= from the dashboard URL. Missing values fall back to the
// current month; anything malformed or outside what the database accepts
// (month 1-12, year 2000-2100) returns null so the caller can redirect.
export function parseMonthParams(
  params: { month?: string; year?: string },
  now: Date = new Date(),
): { month: number; year: number } | null {
  const current = currentMonth(now);
  const month = params.month === undefined ? current.month : parseInteger(params.month);
  const year = params.year === undefined ? current.year : parseInteger(params.year);

  if (month === null || year === null) return null;
  if (month < 1 || month > 12 || year < 2000 || year > 2100) return null;
  return { month, year };
}

function parseInteger(value: string): number | null {
  return /^\d{1,4}$/.test(value) ? Number(value) : null;
}
