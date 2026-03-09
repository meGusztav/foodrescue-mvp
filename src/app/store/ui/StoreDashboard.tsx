"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Store = {
  id: string;
  name: string;
  city: string | null;
  area: string | null;
  address: string | null;
  phone: string | null;
  pickup_notes: string | null;
};

type Deal = {
  id: string;
  title: string;
  deal_price: number;
  quantity_total: number;
  quantity_reserved: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};

type Reservation = {
  id: string;
  deal_id: string;
  user_email: string | null;
  qty: number;
  code: string;
  status: string;
  created_at: string;
};

function toIsoOrNull(v: string) {
  const t = v.trim();
  if (!t) return null;
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export default function StoreDashboard({ onSignedOut }: { onSignedOut?: () => void }) {
  const [email, setEmail] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const [deals, setDeals] = useState<Deal[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  // Create deal form
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [original, setOriginal] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("10");
  const [pickupStart, setPickupStart] = useState("");
  const [pickupEnd, setPickupEnd] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const reservationsByDeal = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const r of reservations) {
      map.set(r.deal_id, [...(map.get(r.deal_id) ?? []), r]);
    }
    return map;
  }, [reservations]);

  async function refresh() {
  setMsg(null);
  setLoading(true);

  try {
    const { data: sess, error: sessErr } = await supabase.auth.getSession();
    if (sessErr) throw sessErr;

    const user = sess.session?.user;

    if (!user) {
      setEmail(null);
      setStoreId(null);
      setStore(null);
      setDeals([]);
      setReservations([]);
      setMsg("You are signed out. Please sign in again.");
      return;
    }

    setEmail(user.email ?? null);

    // Get store_id via RPC
    const { data: myStore, error: storeErr } = await supabase.rpc("my_store_id");
    if (storeErr) throw storeErr;

    if (!myStore) {
      setStoreId(null);
      setStore(null);
      setDeals([]);
      setReservations([]);
      setMsg("Your account is not linked to a store yet. Ask admin to link you.");
      return;
    }

    setStoreId(myStore);

    const { data: storeRow, error: storeRowErr } = await supabase
      .from("stores")
      .select("*")
      .eq("id", myStore)
      .single();
    if (storeRowErr) throw storeRowErr;

    setStore(storeRow);

    const { data: dealsData, error: dealsErr } = await supabase
      .from("deals")
      .select("id,title,deal_price,quantity_total,quantity_reserved,is_active,expires_at,created_at")
      .eq("store_id", myStore)
      .order("created_at", { ascending: false })
      .limit(50);
    if (dealsErr) throw dealsErr;

    setDeals(dealsData ?? []);

    const { data: resData, error: resErr } = await supabase
      .from("reservations")
      .select("id,deal_id,user_email,qty,code,status,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (resErr) throw resErr;

    setReservations(resData ?? []);
  } catch (e: any) {
    setMsg(e?.message ?? "Could not load store dashboard.");
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createDeal() {
    setMsg(null);
    if (!storeId) return;

    if (!title.trim()) return setMsg("Title is required.");
    const priceNum = Number(price);
    const qtyNum = Number(qty);
    const origNum = original.trim() ? Number(original) : null;

    if (!Number.isFinite(priceNum) || priceNum <= 0) return setMsg("Price must be > 0.");
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) return setMsg("Quantity must be > 0.");
    if (origNum !== null && (!Number.isFinite(origNum) || origNum <= 0)) return setMsg("Original price must be blank or > 0.");

    const expiresIso = toIsoOrNull(expiresAt) ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const payload = {
      store_id: storeId,
      title: title.trim(),
      description: desc.trim() || null,
      original_price: origNum,
      deal_price: priceNum,
      quantity_total: Math.floor(qtyNum),
      pickup_start: toIsoOrNull(pickupStart),
      pickup_end: toIsoOrNull(pickupEnd),
      expires_at: expiresIso,
      is_active: true,
    };

    const { error } = await supabase.from("deals").insert(payload);
    if (error) return setMsg(`Create deal failed: ${error.message}`);

    setTitle("");
    setDesc("");
    setOriginal("");
    setPrice("");
    setQty("10");
    setPickupStart("");
    setPickupEnd("");
    setExpiresAt("");
    setMsg("Deal created.");
    await refresh();
  }

  async function toggleDeal(dealId: string, next: boolean) {
    setMsg(null);
    const { error } = await supabase.from("deals").update({ is_active: next }).eq("id", dealId);
    if (error) return setMsg(`Update failed: ${error.message}`);
    await refresh();
  }

  async function markPickedUp(resId: string) {
    setMsg(null);
    const { error } = await supabase.from("reservations").update({ status: "picked_up" }).eq("id", resId);
    if (error) return setMsg(`Update failed: ${error.message}`);
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card p-5 flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="text-sm">
          <div className="muted">Signed in as</div>
          <div className="font-medium">
            {loading ? "Loading…" : (email ?? "—")}
          </div>

          <div className="muted mt-1">
            {loading
              ? "Store: Loading…"
              : store
                ? `Store: ${store.name}`
                : "Store: —"}
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            const { error } = await supabase.auth.signOut();
            if (!error) onSignedOut?.();
          }}
        >
          Sign out
        </button>
      </div>

      {msg ? <div className="card p-4 text-sm">{msg}</div> : null}

      {/* Create deal */}
      <div className="card p-6">
        <h2 className="font-semibold">Create a deal</h2>
        <p className="text-sm muted mt-1">Tip: leave date fields blank if you’re unsure. Expiry defaults to 24h.</p>

        <div className="mt-4 grid gap-3 max-w-2xl">
          <input className="rounded-xl border px-3 py-2 ring-focus" placeholder="Title (e.g., Surprise Pastry Bag)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea className="rounded-xl border px-3 py-2 ring-focus" rows={3} placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />

          <div className="grid gap-3 sm:grid-cols-3">
            <input className="rounded-xl border px-3 py-2 ring-focus" placeholder="Original price (optional)" value={original} onChange={(e) => setOriginal(e.target.value)} />
            <input className="rounded-xl border px-3 py-2 ring-focus" placeholder="Deal price" value={price} onChange={(e) => setPrice(e.target.value)} />
            <input className="rounded-xl border px-3 py-2 ring-focus" placeholder="Qty total" value={qty} onChange={(e) => setQty(e.target.value)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-xl border px-3 py-2 ring-focus" placeholder="Pickup start (e.g., 2026-02-21 19:00)" value={pickupStart} onChange={(e) => setPickupStart(e.target.value)} />
            <input className="rounded-xl border px-3 py-2 ring-focus" placeholder="Pickup end (e.g., 2026-02-21 21:00)" value={pickupEnd} onChange={(e) => setPickupEnd(e.target.value)} />
          </div>

          <input className="rounded-xl border px-3 py-2 ring-focus" placeholder="Expires at (optional)" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />

          <button className="btn btn-primary ring-focus w-fit" onClick={createDeal}>
            Publish deal
          </button>
        </div>
      </div>

      {/* Deals list */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="font-semibold">Your deals</h3>
          <div className="mt-4 space-y-3">
            {deals.length === 0 ? (
              <div className="text-sm muted">No deals yet.</div>
            ) : (
              deals.slice(0, 10).map((d) => {
                const remaining = d.quantity_total - d.quantity_reserved;
                return (
                  <div key={d.id} className="border rounded-2xl p-4" style={{ borderColor: "hsl(var(--border))" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{d.title}</div>
                        <div className="text-sm muted">₱{d.deal_price} • Remaining {remaining}</div>
                      </div>
                      <button
                        className="btn btn-outline ring-focus"
                        onClick={() => toggleDeal(d.id, !d.is_active)}
                      >
                        {d.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>

                    <div className="mt-3 text-xs muted">
                      Reservations: {(reservationsByDeal.get(d.id) ?? []).length}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Reservations */}
        <div className="card p-6">
          <h3 className="font-semibold">Recent reservations</h3>
          <div className="mt-4 space-y-3">
            {reservations.length === 0 ? (
              <div className="text-sm muted">No reservations yet.</div>
            ) : (
              reservations.slice(0, 12).map((r) => (
                <div key={r.id} className="border rounded-2xl p-4" style={{ borderColor: "hsl(var(--border))" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium tracking-widest">{r.code}</div>
                      <div className="text-sm muted">
                        Qty {r.qty} • {r.user_email ?? "no email"} • {r.status}
                      </div>
                    </div>
                    {r.status !== "picked_up" ? (
                      <button className="btn btn-primary ring-focus" onClick={() => markPickedUp(r.id)}>
                        Picked up
                      </button>
                    ) : (
                      <span className="chip">Done</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="text-xs muted">
        Store link not working? Ask admin to link your account in <span className="font-mono">store_users</span>.
      </div>
    </div>
  );
}