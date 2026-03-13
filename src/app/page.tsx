import Link from "next/link";
import {
  MapPin,
  Store,
  UtensilsCrossed,
  Croissant,
  Coffee,
  ShoppingBasket,
  Sandwich,
  Star,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatMoney } from "@/lib/utils";

const categories = [
  { label: "All", icon: Store, active: true },
  { label: "Restaurants", icon: UtensilsCrossed },
  { label: "Bakeries", icon: Croissant },
  { label: "Cafés", icon: Coffee },
  { label: "Groceries", icon: ShoppingBasket },
  { label: "Delis", icon: Sandwich },
];

type HomeDeal = {
  id: string;
  title: string;
  description: string | null;
  deal_price: number;
  original_price: number | null;
  quantity_total: number;
  quantity_reserved: number;
  quantity_remaining: number | null;
  pickup_start: string | null;
  pickup_end: string | null;
  expires_at: string | null;
  image_url: string | null;
  show_on_homepage?: boolean;
  homepage_rank?: number | null;
  store_name: string;
  store_city: string | null;
  store_area: string | null;
  store_category: string | null;
  store_rating: number | null;
};

function formatTimeRange(start: string | null, end: string | null) {
  if (!start || !end) return "Pickup time varies";

  const s = new Date(start);
  const e = new Date(end);

  const sText = s.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });

  const eText = e.toLocaleTimeString("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${sText} - ${eText}`;
}

function percentOff(original: number | null, deal: number) {
  if (!original || original <= 0) return null;
  return Math.round((1 - deal / original) * 100);
}

export default async function HomePage() {
  const nowIso = new Date().toISOString();

  const { data: featuredData, error: featuredError } = await supabase
    .from("deals_with_remaining")
    .select("*")
    .eq("is_active", true)
    .eq("show_on_homepage", true)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("homepage_rank", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("deals_with_remaining")
    .select("*")
    .eq("is_active", true)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("created_at", { ascending: false })
    .limit(6);

  const error = featuredError ?? fallbackError;

  const deals = (
    ((featuredData && featuredData.length > 0 ? featuredData : fallbackData) ?? []) as HomeDeal[]
  ).filter((d) => !d.expires_at || new Date(d.expires_at) > new Date());

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-red-600">
        Failed to load homepage deals: {error.message}
      </div>
    );
  }

  return (
    <div className="-mx-4 md:-mx-6 lg:-mx-8">
      <section className="bg-[#2f7d55] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16 lg:px-8 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h1 className="max-w-2xl text-5xl font-extrabold leading-[0.95] tracking-tight md:text-6xl">
                Rescue delicious food,
                <br />
                save money &amp; the
                <br />
                planet
              </h1>

              <p className="mt-6 max-w-xl text-lg text-white/85">
                Grab surplus bundles from your favorite local stores at up to 70% off.
                Less waste, more value.
              </p>

              <div className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center rounded-2xl bg-white px-4 py-4 text-slate-700 shadow-sm">
                  <MapPin className="mr-3 h-5 w-5 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    placeholder="Enter your location..."
                  />
                </div>

                <Link
                  href="/deals"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#f2a81d] px-8 py-4 text-sm font-bold text-slate-900 transition hover:brightness-95"
                >
                  Explore
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-8 text-sm font-semibold text-white/90">
                <div>500+ stores</div>
                <div>25K+ meals saved</div>
                <div>4.8★ rating</div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-[540px] rounded-md bg-white p-6 shadow-xl">
                <div className="grid grid-cols-3 gap-4 rounded-2xl bg-[#fff8ef] p-5">
                  <div className="col-span-1 space-y-3">
                    <div className="rounded-2xl bg-[#ffe7ba] p-4 text-center text-4xl">🥐</div>
                    <div className="rounded-2xl bg-[#e8f5e9] p-4 text-center text-4xl">🥬</div>
                    <div className="rounded-2xl bg-[#ffe0cc] p-4 text-center text-4xl">🍊</div>
                  </div>

                  <div className="col-span-2 grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#fff0c9] p-4 text-center text-5xl">🛍️</div>
                      <div className="rounded-2xl bg-[#fff7db] p-4 text-center text-5xl">🥕</div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-[#ffe4d2] p-3 text-center text-3xl">🍞</div>
                      <div className="rounded-2xl bg-[#eaf7ea] p-3 text-center text-3xl">🥗</div>
                      <div className="rounded-2xl bg-[#fff0c9] p-3 text-center text-3xl">🍱</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#fff7db] p-4 text-center text-4xl">🥬</div>
                      <div className="rounded-2xl bg-[#ffe4d2] p-4 text-center text-4xl">🍅</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 md:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Browse by category
        </h2>

        <div className="mt-6 flex flex-wrap gap-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.label}
                className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition ${
                  category.active
                    ? "border-[#2f7d55] bg-[#2f7d55] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {category.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Surprise Bags near you
            </h2>
          </div>
          <Link href="/deals" className="text-sm font-semibold text-[#2f7d55] hover:underline">
            View all
          </Link>
        </div>

        {deals.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 text-slate-500">
            No deals yet. Once stores start posting, they’ll show up here automatically.
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {deals.map((deal) => {
              const off = percentOff(deal.original_price, deal.deal_price);
              const remaining =
                deal.quantity_remaining ??
                Math.max(0, deal.quantity_total - deal.quantity_reserved);

              return (
                <Link
                  href={`/deals/${deal.id}`}
                  key={deal.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    {deal.image_url ? (
                      <img
                        src={deal.image_url}
                        alt={deal.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-6xl">
                        🍱
                      </div>
                    )}

                    {remaining <= 3 ? (
                      <div className="absolute left-4 top-4 rounded-full bg-[#ff5c5c] px-3 py-1 text-xs font-bold text-white shadow">
                        Only {remaining} left!
                      </div>
                    ) : null}

                    {deal.store_rating ? (
                      <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">
                        <Star className="h-3.5 w-3.5 fill-[#f2a81d] text-[#f2a81d]" />
                        {deal.store_rating}
                      </div>
                    ) : null}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xl font-extrabold text-slate-900">
                          {deal.store_name}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {deal.store_category ?? "Store"}
                          {deal.store_area ? ` • ${deal.store_area}` : ""}
                        </div>
                      </div>

                      <div className="text-right">
                        {deal.original_price ? (
                          <div className="text-xs text-slate-400 line-through">
                            {formatMoney(deal.original_price)}
                          </div>
                        ) : null}
                        <div className="text-3xl font-extrabold text-[#2f7d55]">
                          {formatMoney(deal.deal_price)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-lg font-bold text-slate-900">
                      {deal.title}
                    </div>

                    <div className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {deal.description ?? "Surplus food bundle available for pickup."}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                      <div className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {deal.store_city ?? "Metro Manila"}
                      </div>
                      <div>{formatTimeRange(deal.pickup_start, deal.pickup_end)}</div>
                      {off ? <div className="font-semibold text-[#2f7d55]">{off}% off</div> : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}