import Link from "next/link";
import { getAllMonthlyRecords, getUserEmail } from "@/lib/data";
import { calculateMonth } from "@/lib/calc";
import { currency } from "@/lib/format";
import { currentMonth } from "@/lib/month";
import { MONTH_NAMES } from "@/lib/types";
import NavBar from "@/components/NavBar";

export default async function HistoryPage() {
  const { month: currentMonthNumber, year: currentYear } = currentMonth();

  const [email, allRecords] = await Promise.all([getUserEmail(), getAllMonthlyRecords()]);
  const rows = allRecords
    .filter(
      (r) =>
        r.locked_status || r.year < currentYear || (r.year === currentYear && r.month < currentMonthNumber),
    )
    .map((record) => ({ record, result: calculateMonth(record, record.expenses) }));

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar email={email} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="mb-5 font-display text-xl font-semibold text-ink">Geschiedenis</h1>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-canvas text-muted">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Maand</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Totaal inkomen</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Totale lasten</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Spaarpot</th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(({ record, result }) => (
                  <tr key={record.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">
                      {MONTH_NAMES[record.month - 1]} {record.year}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                      {currency(Number(record.user1_income) + Number(record.user2_income))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">{currency(result.totalExpenses)}</td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums">{currency(result.savings)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {record.locked_status ? (
                        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-ink">
                          Vergrendeld
                        </span>
                      ) : (
                        <span className="rounded-full bg-canvas px-2 py-0.5 text-xs font-medium text-muted">
                          Open
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        href={`/dashboard?month=${record.month}&year=${record.year}`}
                        className="press text-dominant hover:underline"
                      >
                        Bekijken
                      </Link>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted">
                      Nog geen maanden geregistreerd.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
