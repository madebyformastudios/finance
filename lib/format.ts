const eur = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

export function currency(n: number) {
  return eur.format(n);
}
