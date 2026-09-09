import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllMonthlyRecords, getExpensesForRecords } from "@/lib/data";
import { calculate } from "@/lib/calc";
import { MONTH_NAMES } from "@/lib/types";
import NavBar from "@/components/NavBar";

const eur = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
function currency(n: number) {
  return eur.format(n);
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const records = await getAllMonthlyRecords();
  const expenses = await getExpensesForRecords(records.map((r) => r.id));

  const rows = records.map((r) => {
    const extraTotal = expenses
      .filter((e) => e.monthly_record_id === r.id)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    const result = calculate({
      user1Income: Number(r.user1_income),
      user2Income: Number(r.user2_income),
      user1Fixed: Number(r.user1_fixed),
      user2Fixed: Number(r.user2_fixed),
      jointFixed: Number(r.joint_fixed),
      jointGroceries: Number(r.joint_groceries),
      extraExpenses: extraTotal,
      creditCardBill: Number(r.credit_card_bill),
    });

    return { record: r, result };
  });

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar email={user?.email} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="mb-5 font-display text-xl font-semibold text-ink">Geschiedenis</h1>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Maand</th>
                <th className="px-4 py-3 font-medium">Totaal inkomen</th>
                <th className="px-4 py-3 font-medium">Totale lasten</th>
                <th className="px-4 py-3 font-medium">Spaarpot</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ record, result }) => (
                <tr key={record.id}>
                  <td className="px-4 py-3 font-medium text-ink">
                    {MONTH_NAMES[record.month - 1]} {record.year}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {currency(Number(record.user1_income) + Number(record.user2_income))}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{currency(result.totalExpenses)}</td>
                  <td className="px-4 py-3 tabular-nums">{currency(result.savings)}</td>
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 text-right">
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
      </main>
    </div>
  );
}
