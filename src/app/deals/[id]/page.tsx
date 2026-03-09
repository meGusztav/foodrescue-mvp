import { supabase } from "@/lib/supabase";
import { formatDateTime, formatMoney } from "@/lib/utils";
import type { Deal } from "@/types";
import ReserveCard from "@/components/ReserveCard";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ code?: string }>;
};

function pctOff(original: number | null, deal: number) {
  if (!original || original <= 0) return null;
  const pct = Math.round((1 - deal / original) * 100);
  return Number.isFinite(pct) && pct > 0 ? pct : null;
}

export default async function DealDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : undefined;

  if (!id || id === "undefined") {
    return (
      <div className="text-sm">
        <div className="text-red-600 font-medium">Invalid deal URL.</div>
        <div className="muted mt-2">Missing deal id.</div>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("deals_with_remaining")
    .select("*")
    .eq("id", String(id))
    .single();

  if (error || !data) {
    return (
      <div className="text-sm">
        <div className="text-red-600 font-medium">Deal not found.</div>
        <div className="muted mt-2">
          This usually means the deal is expired, inactive, or hidden by RLS.
        </div>
        {error ? <div className="mt-3 text-xs muted">Debug: {error.message}</div> : null}
      </div>
    );
  }

  const d = data as Deal;
  const remaining = d.quantity_remaining ?? (d.quantity_total - d.quantity_reserved);
  const off = pctOff(d.original_price ?? null, d.deal_price);

  return (
    <div className="space-y-6">
      {/* Success banner */}
      {sp?.code ? (
        <div
          className="card p-5 md:p-6"
          style={{
            borderColor: "hsl(var(--primary) / 0.30)",
            background: "hsl(var(--primary) / 0.06)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold">Reserved!</div>
              <div className="text-sm muted mt-1">Show this code at pickup:</div>
            </div>
            <div className="text-2xl md:text-3xl font-extrabold tracking-[0.25em]">
              {sp.code}
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
        {/* Left content */}
        <div className="lg:col-span-3 space-y-6">
          {/* “Image” header (placeholder gradient panel; later swap to real image_url) */}
          <div className="card overflow-hidden">
            <div
              className="h-56 md:h-72"
              style={{
                background:
                  "radial-gradient(circle at 30% 20%, hsl(var(--primary) / 0.25), transparent 55%), radial-gradient(circle at 80% 10%, hsl(var(--accent) / 0.20), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0.95))",
              }}
            />
            <div className="p-6 md:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm muted">{d.store_name}</div>
                  <h1 className="mt-1 text-3xl md:text-4xl font-extrabold tracking-tight">
                    {d.title}
                  </h1>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-extrabold">{formatMoney(d.deal_price)}</div>
                  {d.original_price ? (
                    <div className="text-sm muted line-through">{formatMoney(d.original_price)}</div>
                  ) : (
                    <div className="text-sm muted">&nbsp;</div>
                  )}
                  {off ? (
                    <div
                      className="chip mt-2 inline-flex"
                      style={{
                        borderColor: "hsl(var(--accent) / 0.35)",
                        background: "hsl(var(--accent) / 0.10)",
                      }}
                    >
                      <span style={{ color: "hsl(var(--accent))" }}>↓</span> {off}% off
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="chip">Remaining: {Math.max(0, remaining)}</span>
                <span className="chip">Reserve code</span>
                <span className="chip">Pickup in-store</span>
              </div>

              <p className="mt-5 text-sm md:text-base muted leading-relaxed">
                {d.description ?? "—"}
              </p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-6">
              <div className="text-sm font-extrabold">Pickup window</div>
              <div className="mt-3 text-sm">
                <div className="muted">Start</div>
                <div className="font-semibold">{formatDateTime(d.pickup_start)}</div>
                <div className="muted mt-3">End</div>
                <div className="font-semibold">{formatDateTime(d.pickup_end)}</div>
              </div>

              <div className="mt-4 card-soft p-4">
                <div className="text-xs muted">Expires</div>
                <div className="text-sm font-semibold mt-1">{formatDateTime(d.expires_at)}</div>
              </div>
            </div>

            <div className="card p-6">
              <div className="text-sm font-extrabold">Store info</div>
              <div className="mt-3 text-sm space-y-2">
                <div>
                  <div className="muted">Address</div>
                  <div className="font-semibold">
                    {d.store_address ?? "—"}
                    {d.store_area ? `, ${d.store_area}` : ""}
                    {d.store_city ? `, ${d.store_city}` : ""}
                  </div>
                </div>
                <div>
                  <div className="muted">Contact</div>
                  <div className="font-semibold">{d.store_phone ?? "—"}</div>
                </div>
                <div>
                  <div className="muted">Pickup notes</div>
                  <div className="font-semibold">{d.store_pickup_notes ?? "—"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust/FAQ */}
          <div className="card p-6">
            <div className="text-sm font-extrabold">Quick FAQ</div>
            <div className="mt-4 grid gap-4 text-sm">
              <div>
                <div className="font-semibold">What will I get?</div>
                <div className="muted mt-1">
                  A surprise bundle based on today’s surplus. Exact items may vary.
                </div>
              </div>
              <div>
                <div className="font-semibold">Do I need an account?</div>
                <div className="muted mt-1">
                  No — you can reserve with or without email. You’ll receive a code.
                </div>
              </div>
              <div>
                <div className="font-semibold">How do I redeem?</div>
                <div className="muted mt-1">
                  Show your code to the staff during the pickup window.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right sticky reserve */}
        <div className="lg:col-span-2">
          <ReserveCard dealId={d.id} remaining={remaining} />

          {/* extra trust box */}
          <div className="card-soft p-6 mt-4">
            <div className="text-sm font-extrabold">Good to know</div>
            <div className="mt-2 text-sm muted">
              Arrive during the pickup window. If you’re late, the store may run out.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}