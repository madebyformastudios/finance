# Couple Finance Tracker

A shared monthly finance tracker for two users, built per `Finance_Tracker_PRD.pdf`.

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript
- Tailwind CSS + Framer Motion
- Supabase (Postgres + Auth with Google OAuth)

## Setup

1. Create a Supabase project.
2. In **Authentication → Providers**, enable Google and configure the OAuth client (redirect URL: `<your-app-url>/auth/callback`, and `http://localhost:3000/auth/callback` for local dev).
3. In the Supabase SQL editor, run `supabase/schema.sql` to create tables, RLS policies, and the trigger that creates a `profiles` row on first sign-in.
4. Copy `.env.local.example` to `.env.local` and fill in your project's URL and anon key (Project Settings → API).
5. Install deps and run:

   ```bash
   npm install
   npm run dev
   ```

## How the numbers work

See `lib/calc.ts` for the calculation engine (mirrors PRD §3.3):

1. `Total Expenses = Joint Fixed + Joint Groceries + User1 Fixed + User2 Fixed + Extra + Credit Card`
2. `User1 Balance = User1 Income - Total Expenses` (User 1 pays every bill first)
3. If `User1 Balance < 0`, User 2 first covers the shortfall; whatever's left of User 2's income splits 50% savings / 25% User 1 payout / 25% User 2 payout.
4. Edge case not specified in the PRD: if User 2's income can't cover the shortfall, savings/payouts are floored at 0 and the gap is shown as a couple-level "deficit" for the month instead of going negative.

`User1 Fixed`/`User2 Fixed` are each the sum of that person's itemized `personal_fixed` expenses (Auto, Verzekering, Mobiel, ...) for the month — not a single aggregate field. See "Personal fixed costs" below.

## Personal fixed costs

Each user's recurring personal costs are itemized rows in `expenses` (`type = 'personal_fixed'`, `assignee = 'user1' | 'user2'`), editable from the dashboard's "Vaste lasten" section — add with "+ Voeg vaste last toe", remove per item. When a new month is created, `lib/data.ts#clonePersonalFixedExpenses` automatically copies the previous month's `personal_fixed` items (description + amount) into the new one; edit or delete them from there, nothing is shared/linked back to the source month.

## Savings goals (Spaardoelen)

Savings pots (`savings_pots`: `name`, `current_balance`, optional `target_amount`) are persistent, not scoped to a month — balances carry forward automatically. Every deposit or withdrawal is a row in `savings_transactions` (`pot_id`, `monthly_record_id` nullable, `amount` — positive for deposits, negative for withdrawals, `description`); a `savings_transactions_apply` trigger keeps `savings_pots.current_balance` in sync atomically, so the app only ever inserts transactions and never writes the balance directly.

- **Dashboard** (`components/SavingsGoals.tsx`, under "Verdeling"): "Nog te verdelen" = this month's savings pot minus the sum of transactions already tagged with the current `monthly_record_id` — colored sage/gray/terracotta for positive/zero/negative. Allocating to a pot creates a transaction ("Maandelijkse inleg <maand>") and is blocked client-side if it would exceed what's left. A pot can also be created inline here.
- **`/spaardoelen`**: a bento grid of every pot (balance, progress bar if it has a target), a "Geld opnemen" modal per card that creates a negative transaction (blocked client-side above the pot's current balance), a form to create new pots, and a full transaction history across all pots.

## Design

The UI follows `DESIGN.md`: Dutch-only copy throughout, a warm off-white/deep-green palette (no default slate/purple-blue gradients), Space Grotesk for headings paired with Geist for tabular financial data, a bento-box layout with a dark hero card for the month's surplus/shortfall, an animated 50/25/25 allocation donut (`components/Donut.tsx`), budget-share progress bars, Jairo/Naroa avatars (`components/Avatar.tsx`), and count-up numbers (`components/CountUp.tsx`).

## Notes / follow-ups

- **Auth scope**: per the PRD, login should eventually be restricted to two specific Google accounts. For now any Google account can sign in (RLS only requires `authenticated`). To lock it down, add an email allowlist check to the RLS policies in `supabase/schema.sql` (see the note at the bottom of that file) once the two emails are confirmed.
- **Locking**: either user can edit an open month; either can lock/unlock it from the dashboard. Locked months are read-only (enforced both in the UI and in RLS/update policies).
- Settings (`/settings`) hold the joint fixed/groceries defaults used to pre-fill new months. Personal fixed costs are no longer a single default — they carry over per item from the previous month instead (see above).
