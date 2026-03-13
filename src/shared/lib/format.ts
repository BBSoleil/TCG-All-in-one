export function formatPrice(amount: number, currency = "EUR"): string {
  if (currency === "EUR") return `€${amount.toFixed(2)}`;
  if (currency === "USD") return `$${amount.toFixed(2)}`;
  return `${amount.toFixed(2)} ${currency}`;
}
