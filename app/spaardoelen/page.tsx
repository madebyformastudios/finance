import { createClient } from "@/lib/supabase/server";
import { getRecentSavingsTransactions, getSavingsPots } from "@/lib/data";
import NavBar from "@/components/NavBar";
import SavingsPotCard from "@/components/SavingsPotCard";
import NewPotForm from "@/components/NewPotForm";

const eur = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
function currency(n: number) {
  return eur.format(n);
}

const dateFormat = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric" });

export default async function SpaardoelenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pots = await getSavingsPots();
  const transactions = await getRecentSavingsTransactions(100);
  const potNameById = new Map(pots.map((p) => [p.id, p.name]));

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar email={user?.email} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="mb-5 font-display text-xl font-semibold text-ink">Spaardoelen</h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {pots.map((pot) => (
            <SavingsPotCard key={pot.id} pot={pot} />
          ))}
          {pots.length === 0 && (
            <p className="text-sm text-muted sm:col-span-2">Nog geen spaarpotjes. Maak hieronder je eerste aan.</p>
          )}
        </div>

        <div className="mt-4">
          <NewPotForm />
        </div>

        <h2 className="mb-3 mt-8 font-display text-sm font-semibold uppercase tracking-wide text-muted">
          Transactiegeschiedenis
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <ul className="divide-y divide-border">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-ink">
                    {potNameById.get(t.pot_id) ?? "Onbekend spaarpotje"}
                  </span>
                  <span className="truncate text-muted">
                    {t.description} · {dateFormat.format(new Date(t.created_at))}
                  </span>
                </div>
                <span
                  className={`shrink-0 tabular-nums font-medium ${
                    Number(t.amount) >= 0 ? "text-surplus-ink" : "text-shortfall"
                  }`}
                >
                  {Number(t.amount) >= 0 ? "+" : ""}
                  {currency(Number(t.amount))}
                </span>
              </li>
            ))}
            {transactions.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-muted">Nog geen transacties.</li>
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
