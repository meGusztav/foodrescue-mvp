"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDateTime, formatMoney } from "@/lib/utils";

type ReservationRow = {
  id: string;
  deal_id: string;
  qty: number;
  code: string;
  status: string;
  created_at: string;
};

type DealRow = {
  id: string;
  title: string;
  deal_price: number;
  pickup_start: string | null;
  pickup_end: string | null;
  store_id: string;
};

type StoreRow = {
  id: string;
  name: string;
};

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [dealsById, setDealsById] = useState<Record<string, DealRow>>({});
  const [storesById, setStoresById] = useState<Record<string, StoreRow>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setAuthed(false);
        setLoading(false);
        return;
      }

      setAuthed(true);

      const { data: reservationData, error: reservationError } = await supabase
        .from("reservations")
        .select("id, deal_id, qty, code, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (reservationError) {
        setError(reservationError.message);
        setLoading(false);
        return;
      }

      const reservationRows = (reservationData ?? []) as ReservationRow[];
      setReservations(reservationRows);

      const dealIds = [...new Set(reservationRows.map((r) => r.deal_id))];

      if (dealIds.length === 0) {
        setDealsById({});
        setStoresById({});
        setLoading(false);
        return;
      }

      const { data: dealsData, error: dealsError } = await supabase
        .from("deals")
        .select("id, title, deal_price, pickup_start, pickup_end, store_id")
        .in("id", dealIds);

      if (dealsError) {
        setError(dealsError.message);
        setLoading(false);
        return;
      }

      const dealRows = (dealsData ?? []) as DealRow[];
      const nextDealsById = Object.fromEntries(dealRows.map((deal) => [deal.id, deal]));
      setDealsById(nextDealsById);

      const storeIds = [...new Set(dealRows.map((deal) => deal.store_id))];

      if (storeIds.length > 0) {
        const { data: storesData, error: storesError } = await supabase
          .from("stores")
          .select("id, name")
          .in("id", storeIds);

        if (storesError) {
          setError(storesError.message);
          setLoading(false);
          return;
        }

        const storeRows = (storesData ?? []) as StoreRow[];
        setStoresById(Object.fromEntries(storeRows.map((store) => [store.id, store])));
      }

      setLoading(false);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="text-sm muted">Loading orders…</div>;
  }

  if (!authed) {
    return (
      <div className="card p-6 md:p-7 max-w-2xl">
        <div className="text-xl font-extrabold">You need to sign in to view your orders.</div>
        <div className="mt-2 text-sm muted">
          Once you log in, your reservations and pickup codes will appear here.
        </div>
        <div className="mt-5 flex gap-3">
          <Link href="/login?next=/orders" className="btn btn-primary">
            Login
          </Link>
          <Link href="/register?next=/orders" className="btn btn-ghost">
            Register
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-red-600">Failed to load orders: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="chip">My orders</div>
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight">
          Your reservations
        </h1>
        <p className="mt-2 text-sm muted">
          Active pickup codes, past reservations, and order history.
        </p>
      </div>

      {reservations.length === 0 ? (
        <div className="card p-6 md:p-7">
          <div className="text-lg font-extrabold">No reservations yet</div>
          <div className="mt-2 text-sm muted">
            Browse live deals and reserve your first surprise bag.
          </div>
          <div className="mt-5">
            <Link href="/deals" className="btn btn-primary">
              Browse deals
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {reservations.map((reservation) => {
            const deal = dealsById[reservation.deal_id];
            const storeName = deal ? storesById[deal.store_id]?.name ?? "Store" : "Store";

            return (
              <div key={reservation.id} className="card p-6 md:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-sm muted">{storeName}</div>
                    <div className="text-xl font-extrabold mt-1">
                      {deal?.title ?? "Deal unavailable"}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="chip">{reservation.status}</div>
                    <div className="mt-2 text-sm font-semibold">
                      {deal ? formatMoney(deal.deal_price) : "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-4 text-sm">
                  <div className="card-soft p-4">
                    <div className="text-xs muted">Pickup code</div>
                    <div className="mt-1 text-lg font-extrabold tracking-[0.2em]">
                      {reservation.code}
                    </div>
                  </div>

                  <div className="card-soft p-4">
                    <div className="text-xs muted">Quantity</div>
                    <div className="mt-1 font-semibold">{reservation.qty}</div>
                  </div>

                  <div className="card-soft p-4">
                    <div className="text-xs muted">Reserved at</div>
                    <div className="mt-1 font-semibold">
                      {formatDateTime(reservation.created_at)}
                    </div>
                  </div>

                  <div className="card-soft p-4">
                    <div className="text-xs muted">Pickup window</div>
                    <div className="mt-1 font-semibold">
                      {deal
                        ? `${formatDateTime(deal.pickup_start)} – ${formatDateTime(deal.pickup_end)}`
                        : "—"}
                    </div>
                  </div>
                </div>

                {deal ? (
                  <div className="mt-4">
                    <Link href={`/deals/${deal.id}`} className="link text-sm">
                      View deal
                    </Link>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}