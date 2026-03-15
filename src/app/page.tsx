import Link from "next/link";
import {
  Clock3,
  Coffee,
  Croissant,
  MapPin,
  Search,
  ShoppingBag,
  ShoppingBasket,
  Smile,
  Star,
  Store,
  UtensilsCrossed,
} from "lucide-react";
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
    .limit(8);

  if (featured && featured.length > 0) return featured;

  const { data: fallback } = await supabase
    .from("deals_with_remaining")
    .select("*")
    .eq("is_active", true)
    .gt("quantity_remaining", 0)
    .order("created_at", { ascending: false })
    .limit(8);

  return fallback ?? [];
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

function categoryLabel(category?: string | null) {
  if (!category) return "Food";
  return category;
}

function CategoryPill({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={
        active
          ? "inline-flex items-center gap-2 rounded-full bg-[#2F6F4E] px-4 py-2 text-[13px] font-semibold text-white"
          : "inline-flex items-center gap-2 rounded-full border border-black/8 bg-white px-4 py-2 text-[13px] font-semibold text-[#708278] transition hover:bg-black/[0.02]"
      }
    >
      {icon}
      {label}
    </button>
  );
}

function DealCard({ deal }: { deal: any }) {
  const pct =
    deal.original_price && deal.original_price > 0
      ? Math.round((1 - deal.deal_price / deal.original_price) * 100)
      : null;

  const pickupWindow = `${formatPickupTime(deal.pickup_start)} - ${formatPickupTime(
    deal.pickup_end
  )}`;

  return (
    <Link
      href={`/deals/${deal.id}`}
      className="overflow-hidden rounded-[18px] border border-black/6 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="relative h-[190px] overflow-hidden bg-[#EDEAE1]">
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

        {deal.quantity_remaining <= 3 ? (
          <div className="absolute left-3 top-3 rounded-full bg-[#F05B4F] px-2.5 py-1 text-[11px] font-bold text-white">
            Only {deal.quantity_remaining} left!
          </div>
        ) : null}

        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-bold text-[#24332B] shadow-sm">
          <Star size={11} className="fill-[#F0B233] text-[#F0B233]" />
          {Number(deal.store_rating ?? deal.rating ?? 4.8).toFixed(1)}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold text-[#1C2E25]">
              {deal.store_name}
            </div>
            <div className="mt-0.5 text-[11px] text-[#7A8A82]">
              {categoryLabel(deal.store_category ?? deal.category)} •{" "}
              {deal.store_area ?? deal.area ?? "Nearby"}
            </div>
          </div>

          {deal.original_price ? (
            <div className="shrink-0 text-[11px] text-[#97A39C] line-through">
              {formatMoney(deal.original_price)}
            </div>
          ) : null}
        </div>

        <div className="mt-3 line-clamp-2 text-[17px] font-bold leading-snug text-[#12212B]">
          {deal.title}
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="text-[30px] font-extrabold tracking-tight text-[#1E6B49]">
            {formatMoney(deal.deal_price)}
          </div>

          {pct ? (
            <div className="rounded-full bg-[#F7F3E8] px-2.5 py-1 text-[11px] font-bold text-[#233229]">
              {pct}% off
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] font-medium text-[#7A8A82]">
          <div className="inline-flex items-center gap-1.5">
            <MapPin size={12} />
            {deal.distance_km ? `${deal.distance_km} km` : "Nearby"}
          </div>

          <div className="inline-flex items-center gap-1.5">
            <Clock3 size={12} />
            {pickupWindow}
          </div>
        </div>
      </div>
    </Link>
  );
}

function HowItWorksStep({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E7ECE2] text-[#2F6F4E]">
        {icon}
      </div>
      <h3 className="mt-5 text-[18px] font-bold text-[#12212B]">{title}</h3>
      <p className="mt-3 max-w-[280px] text-[14px] leading-6 text-[#7A8A82]">
        {description}
      </p>
    </div>
  );
}

export default async function HomePage() {
  const deals = await loadDeals();

  return (
    <div className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 bg-[#F7F5EF]">
      <section className="w-full bg-[#3D8058]">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-8 py-14 md:px-10 md:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 xl:px-12">
          <div className="max-w-[620px]">
            <h1 className="text-[52px] font-extrabold leading-[0.98] tracking-tight text-[#F7F3EA] md:text-[72px] xl:text-[78px]">
              Rescue delicious food,
              <br />
              save money &amp; the
              <br />
              planet
            </h1>

            <p className="mt-5 max-w-[560px] text-[18px] leading-8 text-white/82 md:text-[20px]">
              Grab Surprise Bags from your favourite local stores at up to 70% off.
              Less waste, more taste!
            </p>

            <div className="mt-7 flex max-w-[540px] items-center gap-3">
              <div className="flex h-[50px] flex-1 items-center rounded-[14px] bg-white px-4 shadow-sm">
                <Search size={17} className="mr-2 text-black/35" />
                <input
                  type="text"
                  placeholder="Enter your location..."
                  className="w-full bg-transparent text-[14px] text-[#24332B] outline-none placeholder:text-black/40"
                />
              </div>

              <button
                type="button"
                className="h-[50px] rounded-[14px] bg-[#F0B233] px-6 text-[14px] font-bold text-[#1B1B1B] transition hover:brightness-95"
              >
                Explore
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-[13px] font-semibold text-white/85 md:text-[14px]">
              <div>
                <span className="font-extrabold text-white">2,500+</span> stores
              </div>
              <div>
                <span className="font-extrabold text-white">150K+</span> meals saved
              </div>
              <div>
                <span className="font-extrabold text-white">4.8★</span> rating
              </div>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[420px] bg-white p-4 shadow-sm xl:max-w-[460px]">
              <img
                src="/hero-food.png"
                alt="SecondServe hero illustration"
                className="h-auto w-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-8 py-12 md:px-10 xl:px-12">
        <div>
          <h2 className="text-[24px] font-extrabold tracking-tight text-[#12212B] md:text-[28px]">
            Browse by category
          </h2>

          <div className="mt-4 flex flex-wrap gap-3">
            <CategoryPill icon={<Store size={14} />} label="All" active />
            <CategoryPill icon={<UtensilsCrossed size={14} />} label="Restaurants" />
            <CategoryPill icon={<Croissant size={14} />} label="Bakeries" />
            <CategoryPill icon={<Coffee size={14} />} label="Cafés" />
            <CategoryPill icon={<ShoppingBasket size={14} />} label="Groceries" />
            <CategoryPill icon={<Store size={14} />} label="Delis" />
          </div>
        </div>

        <div className="mt-10 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-[34px] font-extrabold tracking-tight text-[#12212B] md:text-[40px]">
              Surprise Bags near you
            </h3>
          </div>

          <Link
            href="/deals"
            className="rounded-[14px] border border-black/8 bg-white px-4 py-2.5 text-[13px] font-bold text-[#12212B]"
          >
            View all deals
          </Link>
        </div>

        {deals.length === 0 ? (
          <div className="mt-6 rounded-[20px] border border-black/8 bg-white p-8 shadow-sm">
            <div className="text-lg font-bold text-[#12212B]">No live deals yet</div>
            <div className="mt-2 text-sm text-[#6A7A73]">
              Stores will begin posting surprise bags here soon.
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {deals.map((deal: any) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </section>

      <section id="how-it-works" className="mx-auto max-w-[1240px] px-8 py-20 md:px-10">
        <h2 className="text-center text-[36px] font-extrabold tracking-tight text-[#12212B]">
          How it works
        </h2>

        <div className="mt-14 grid gap-12 md:grid-cols-3">
          <HowItWorksStep
            icon={<Search size={26} />}
            title="Find a store"
            description="Browse surprise bags from restaurants, bakeries, and grocers near you."
          />
          <HowItWorksStep
            icon={<ShoppingBag size={26} />}
            title="Reserve & pay"
            description="Reserve your bag in the app and pay a fraction of the original price."
          />
          <HowItWorksStep
            icon={<Smile size={26} />}
            title="Pick up & enjoy"
            description="Collect your surprise bag during the pickup window. Enjoy the deliciousness!"
          />
        </div>
      </section>

      <footer className="w-full bg-[linear-gradient(90deg,#0D2319,#123426)] text-white">
        <div className="mx-auto max-w-[1440px] px-8 py-14 md:px-10 xl:px-12">
          <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[22px]">🍃</span>
                <span className="text-[30px] font-extrabold tracking-tight">SecondServe</span>
              </div>
              <p className="mt-4 max-w-[280px] text-[15px] leading-7 text-white/70">
                Rescue food. Save money. Love the planet.
              </p>
            </div>

            <div>
              <h3 className="text-[18px] font-bold">Company</h3>
              <div className="mt-5 space-y-3 text-[15px] text-white/70">
                <div>About Us</div>
                <div>Careers</div>
                <div>Press</div>
              </div>
            </div>

            <div>
              <h3 className="text-[18px] font-bold">Support</h3>
              <div className="mt-5 space-y-3 text-[15px] text-white/70">
                <div>Help Centre</div>
                <div>Contact</div>
                <div>FAQ</div>
              </div>
            </div>

            <div>
              <h3 className="text-[18px] font-bold">Legal</h3>
              <div className="mt-5 space-y-3 text-[15px] text-white/70">
                <div>Privacy</div>
                <div>Terms</div>
                <div>Cookies</div>
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-6 text-center text-[14px] text-white/55">
            © 2026 SecondServe. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}