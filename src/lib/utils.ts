export function formatMoney(n: number | string | null | undefined) {
  const num = typeof n === "string" ? Number(n) : n ?? 0;
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(num);
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}