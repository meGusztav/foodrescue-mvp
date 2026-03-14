import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function loadDeals() {
  const { data: featured } = await supabase
    .from("deals_with_remaining")
    .select("*")
    .eq("show_on_homepage", true)
    .eq("is_active", true)
    .gt("quantity_remaining", 0)
    .order("homepage_rank", { ascending: true })
    .limit(12);

  if (featured && featured.length > 0) return featured;

  const { data: fallback } = await supabase
    .from("deals_with_remaining")
    .select("*")
    .eq("is_active", true)
    .gt("quantity_remaining", 0)
    .order("created_at", { ascending: false })
    .limit(12);

  return fallback ?? [];
}

function DealImage({
  imageUrl,
  title,
  className = "h-40",
}: {
  imageUrl?: string | null;
  title: string;
  className?: string;
}) {
  if (!imageUrl) {
    return (
      <div
        className={`${className} bg-[hsl(var(--card))]`}
        style={{
          background:
            "radial-gradient(circle at 30% 20%, hsl(var(--primary) / 0.18), transparent 55%), radial-gradient(circle at 80% 10%, hsl(var(--accent) / 0.14), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.96))",
        }}
      />
    );
  }

  return (
    <div className={`${className} overflow-hidden bg-[hsl(var(--card))]`}>
      <img
        src={imageUrl}
        alt={title}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

function HeroMosaic({ deals }: { deals: any[] }) {
  const heroDeals = deals.slice(0, 4);

  if (heroDeals.length === 0) {
    return (
      <div
        className="h-64 md:h-80 rounded-3xl border"
        style={{
          borderColor: "hsl(var(--border))",
          background:
            "radial-gradient(circle at 30% 20%, hsl(var(--primary) / 0.25), transparent 55%), radial-gradient(circle at 80% 10%, hsl(var(--accent) / 0.20), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0.95))",
        }}
      />
    );
  }

  if (heroDeals.length === 1) {
    const deal = heroDeals[0];
    return (
      <Link
        href={`/deals/${deal.id}`}
        className="block overflow-hidden rounded-3xl border bg-white shadow-sm"
        style={{ borderColor: "hsl(var(--border))" }}
      >
        <DealImage imageUrl={deal.image_url} title={deal.title} className="h-64 md:h-80" />
      </Link>
    );
  }

  return (
    <div
      className="grid h-64 md:h-80 grid-cols-2 gap-3 overflow-hidden rounded-3xl border bg-white p-3 shadow-sm"
      style={{ borderColor: "hsl(var(--border))" }}
    >
      {heroDeals.map((deal) => (
        <Link
          key={deal.id}
          href={`/deals/${deal.id}`}
          className="overflow-hidden rounded-2xl"
        >
          <DealImage imageUrl={deal.image_url} title={deal.title} className="h-full min-h-full" />
        </Link>
      ))}
    </div>
  );
}

export default async function HomePage() {
  const deals = await loadDeals();

  return (
    <div className="space-y-12">
      <section className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="space-y-5">
          <div className="chip">Manila food deals</div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            First dibs on the
            <span className="block text-[hsl(var(--primary))]">second serve</span>
          </h1>

          <p className="text-base muted max-w-xl">
            Discover surprise bags from bakeries, cafés, and restaurants near you. Save money and
            help reduce food waste.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/deals" className="btn btn-primary">
              Browse deals
            </Link>

            <Link href="/login" className="btn btn-ghost">
              Sign in
            </Link>

            <Link href="/register" className="btn btn-ghost">
              Register
            </Link>
          </div>

          <div className="flex gap-2 pt-2 flex-wrap">
            <span className="chip">Surprise bags</span>
            <span className="chip">Up to 70% off</span>
            <span className="chip">Pickup today</span>
          </div>
        </div>

        <HeroMosaic deals={deals} />
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="chip">Featured</div>
            <h2 className="text-3xl font-extrabold tracking-tight mt-2">
              Today’s surprise bags
            </h2>
          </div>

          <Link href="/deals" className="btn btn-ghost">
            View all deals
          </Link>
        </div>

        {deals.length === 0 ? (
          <div className="card p-6">
            <div className="font-semibold">No deals available yet</div>
            <div className="muted text-sm mt-1">
              Stores will start posting surprise bags soon.
            </div>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal: any) => {
              const pct = deal.original_price
                ? Math.round((1 - deal.deal_price / deal.original_price) * 100)
                : null;

              return (
                <Link
                  key={deal.id}
                  href={`/deals/${deal.id}`}
                  className="card overflow-hidden hover:shadow-lg transition"
                >
                  <DealImage imageUrl={deal.image_url} title={deal.title} />

                  <div className="p-5 space-y-3">
                    <div className="text-sm muted">{deal.store_name}</div>

                    <div className="font-extrabold text-lg leading-tight">{deal.title}</div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-lg font-extrabold">
                          {formatMoney(deal.deal_price)}
                        </div>

                        {deal.original_price ? (
                          <div className="text-xs muted line-through">
                            {formatMoney(deal.original_price)}
                          </div>
                        ) : null}
                      </div>

                      {pct ? <div className="chip">{pct}% off</div> : null}
                    </div>

                    <div className="text-xs muted">{deal.quantity_remaining} left</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="card p-8 text-center space-y-4">
        <h2 className="text-2xl font-extrabold">Own a bakery, café, or restaurant?</h2>

        <p className="muted text-sm">
          Turn your surplus food into revenue instead of waste.
        </p>

        <div>
          <Link href="/stores/apply" className="btn btn-primary">
            Partner with SecondServe
          </Link>
        </div>
      </section>
    </div>
  );
}