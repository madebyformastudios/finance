import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getExpensesForRecord, getOrCreateMonthlyRecord, getSavingsAllocationsForRecord } from "@/lib/data";
import { MONTH_NAMES } from "@/lib/types";
import NavBar from "@/components/NavBar";
import MonthForm from "@/components/MonthForm";

function clampMonth(m: number) {
  return ((((m - 1) % 12) + 12) % 12) + 1;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;
  const year = params.year ? Number(params.year) : now.getFullYear();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const record = await getOrCreateMonthlyRecord(month, year);
  const expenses = await getExpensesForRecord(record.id);
  const savingsAllocations = await getSavingsAllocationsForRecord(record.id);

  const prev = month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
  const next = month === 12 ? { month: 1, year: year + 1 } : { month: month + 1, year };

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar email={user?.email} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="mb-4 flex items-center justify-between text-sm text-muted">
          <Link href={`/dashboard?month=${clampMonth(prev.month)}&year=${prev.year}`} className="hover:text-ink">
            ← Vorige maand
          </Link>
          <Link href={`/dashboard?month=${clampMonth(next.month)}&year=${next.year}`} className="hover:text-ink">
            Volgende maand →
          </Link>
        </div>
        <MonthForm
          key={record.id}
          record={record}
          expenses={expenses}
          savingsAllocations={savingsAllocations}
          monthLabel={`${MONTH_NAMES[month - 1]} ${year}`}
        />
      </main>
    </div>
  );
}
