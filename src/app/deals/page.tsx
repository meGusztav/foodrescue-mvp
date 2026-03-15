import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatDateTime, formatMoney } from "@/lib/utils";
import type { Deal } from "@/types";

export const dynamic = "force-dynamic";

function pctOff(original: number | null, deal: number) {
  if (!original || original <= 0) return null;
  const pct = Math.round((1 - deal / original) * 100);
  return Number.isFinite(pct) && pct > 0 ? pct : null;
}

export default async function DealsPage() {
  const { data, error } = await supabase
    .from("deals_with_remaining")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return <div className="text-red-600 text-sm">Error: {error.message}</div>;

  const deals = ((data ?? []) as Deal[]).filter((d) => d?.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Deals near you</h1>
          <p className="mt-1 muted">Reserve a bundle. Pick up during the window.</p>
        </div>

        {/* lightweight filter bar (UI only for now) */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input className="input sm:w-72" placeholder="Search (e.g., pastry, sushi, Makati)" />
          <button className="btn btn-ghost">Filters</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {deals.map((d) => {
          const remaining = d.quantity_remaining ?? (d.quantity_total - d.quantity_reserved);
          const off = pctOff(d.original_price ?? null, d.deal_price);

          return (
            <Link key={d.id} href={`/deals/${d.id}`} className="card p-5 hover:shadow-md transition-shadow hover:-translate-y-[2px]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm muted truncate">{d.store_name}</div>
                  <div className="mt-2 line-clamp-2 text-[16px] font-bold leading-snug text-[#12212B]">
                    {d.title}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-extrabold">{formatMoney(d.deal_price)}</div>
                  {d.original_price ? (
                    <div className="text-xs muted line-through">{formatMoney(d.original_price)}</div>
                  ) : (
                    <div className="text-xs muted"> </div>
                  )}
                </div>
              </div>

              <div className="mt-3 text-sm muted line-clamp-2">{d.description ?? "—"}</div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="chip">Remaining: {Math.max(0, remaining)}</span>
                {off ? (
                  <span
                    className="chip"
                    style={{
                      borderColor: "hsl(var(--accent) / 0.35)",
                      background: "hsl(var(--accent) / 0.10)",
                      color: "hsl(var(--text))",
                    }}
                  >
                    <span style={{ color: "hsl(var(--accent))" }}>↓</span> {off}% off
                  </span>
                ) : null}
              </div>

              <div className="mt-4 card-soft p-4">
                <div className="text-xs muted">Pickup window</div>
                <div className="text-sm font-semibold mt-1">
                  {formatDateTime(d.pickup_start)} – {formatDateTime(d.pickup_end)}
                </div>
                <div className="text-xs muted mt-1">Expires: {formatDateTime(d.expires_at)}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}