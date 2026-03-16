import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function loadDealsPageData() {
  const { data: dealsData, error: dealsError } = await supabase
    .from("deals_with_remaining")
    .select("*")
    .eq("is_active", true)
    .gt("quantity_remaining", 0)
    .order("created_at", { ascending: false });

  if (dealsError) {
    throw new Error(dealsError.message);
  }

  const deals = dealsData ?? [];

  const storeIds = [...new Set(deals.map((deal: any) => deal.store_id).filter(Boolean))];

  let storeLogosById: Record<string, string | null> = {};

  if (storeIds.length > 0) {
    const { data: storesData, error: storesError } = await supabase
      .from("stores")
      .select("id, image_url")
      .in("id", storeIds);

    if (storesError) {
      throw new Error(storesError.message);
    }

    storeLogosById = Object.fromEntries(
      (storesData ?? []).map((store: any) => [store.id, store.image_url ?? null])
    );
  }

  return { deals, storeLogosById };
}

function formatPickupTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function DealsPage() {
  const { deals, storeLogosById } = await loadDealsPageData();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Deals near you</h1>
          <p className="mt-1 text-sm text-[#6B7A72]">
            Reserve a bundle. Pick up during the window.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            placeholder="Search (e.g., pastry, sushi, Makati)"
            className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm outline-none"
          />

          <button className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold">
            Filters
          </button>
        </div>
      </div>

      {deals.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-white p-8 text-sm">
          No deals available yet.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {deals.map((deal: any) => {
            const pct =
              deal.original_price && deal.original_price > 0
                ? Math.round((1 - deal.deal_price / deal.original_price) * 100)
                : null;

            const storeLogoUrl = storeLogosById[deal.store_id] ?? null;

            return (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="overflow-hidden rounded-[18px] border border-black/6 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative h-[180px] w-full overflow-hidden bg-[#EDEAE1]">
                  {deal.image_url ? (
                    <img
                      src={deal.image_url}
                      alt={deal.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-[linear-gradient(180deg,#f4f1e8,#ebe7dc)]" />
                  )}

                  {pct ? (
                    <div className="absolute right-3 top-3 rounded-full bg-white px-2 py-1 text-xs font-bold shadow">
                      {pct}% off
                    </div>
                  ) : null}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-[#F7F5EF]">
                          {storeLogoUrl ? (
                            <img
                              src={storeLogoUrl}
                              alt={deal.store_name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-[#6B7A72]">
                              {(deal.store_name ?? "S").charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="truncate text-xs text-[#6B7A72]">{deal.store_name}</div>
                      </div>
                    </div>

                    <div className="shrink-0 text-lg font-extrabold text-[#1E6B49]">
                      {formatMoney(deal.deal_price)}
                    </div>
                  </div>

                  <div className="mt-2 line-clamp-2 text-[16px] font-bold leading-snug text-[#12212B]">
                    {deal.title}
                  </div>

                  <div className="mt-2 line-clamp-2 text-sm text-[#6B7A72]">
                    {deal.description}
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-[#6B7A72]">
                    <div>Remaining: {deal.quantity_remaining}</div>

                    <div>{formatPickupTime(deal.pickup_start)}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}