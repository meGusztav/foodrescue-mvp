"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Store = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  pickup_notes: string | null;
  created_at: string;
};

type Deal = {
  id: string;
  store_id: string;
  title: string;
  description: string | null;
  original_price: number | null;
  deal_price: number;
  quantity_total: number;
  pickup_start: string | null;
  pickup_end: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

function toIsoOrNull(v: string) {
  const trimmed = v.trim();
  if (!trimmed) return null;
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export default function AdminDashboard() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authMsg, setAuthMsg] = useState<string | null>(null);

  const [stores, setStores] = useState<Store[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Create store form
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeCity, setStoreCity] = useState("");
  const [storeArea, setStoreArea] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeNotes, setStoreNotes] = useState("");
  const [storeMsg, setStoreMsg] = useState<string | null>(null);

  // Create deal form
  const [dealStoreId, setDealStoreId] = useState<string>("");
  const [dealTitle, setDealTitle] = useState("");
  const [dealDesc, setDealDesc] = useState("");
  const [dealOriginal, setDealOriginal] = useState<string>("");
  const [dealPrice, setDealPrice] = useState<string>("");
  const [dealQty, setDealQty] = useState<string>("10");
  const [pickupStart, setPickupStart] = useState<string>("");
  const [pickupEnd, setPickupEnd] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [dealMsg, setDealMsg] = useState<string | null>(null);

  const sortedStores = useMemo(
    () => [...stores].sort((a, b) => a.name.localeCompare(b.name)),
    [stores]
  );

  async function refresh() {
    setLoading(true);
    setAuthMsg(null);

    // Get session
    const { data: sess } = await supabase.auth.getSession();
    const user = sess.session?.user;
    setSessionEmail(user?.email ?? null);

    if (!user) {
      setIsAdmin(false);
      setStores([]);
      setDeals([]);
      setLoading(false);
      setAuthMsg("Not logged in. Go to /admin and sign in.");
      return;
    }

    // Check admin role in profiles (RLS allows user to read own profile)
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profErr) {
      setIsAdmin(false);
      setAuthMsg(`Could not read profile: ${profErr.message}`);
      setLoading(false);
      return;
    }

    const admin = profile?.role === "admin";
    setIsAdmin(admin);

    if (!admin) {
      setStores([]);
      setDeals([]);
      setAuthMsg("You are logged in, but not an admin. Set your role to admin in the profiles table.");
      setLoading(false);
      return;
    }

    // Load stores (anyone can read stores)
    const { data: storesData, error: storesErr } = await supabase
      .from("stores")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (storesErr) {
      setAuthMsg(`Error loading stores: ${storesErr.message}`);
      setLoading(false);
      return;
    }

    // Load deals (public can read only active+non-expired; admin can still create regardless.
    // For dashboard display, it's fine to show active deals via the view:
    const { data: dealsData, error: dealsErr } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (dealsErr) {
      // If RLS blocks reading deals for non-admin, we already checked admin, so this should work.
      setAuthMsg(`Error loading deals: ${dealsErr.message}`);
      setLoading(false);
      return;
    }

    setStores((storesData ?? []) as Store[]);
    setDeals((dealsData ?? []) as Deal[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => {
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createStore() {
    setStoreMsg(null);

    if (!storeName.trim()) {
      setStoreMsg("Store name is required.");
      return;
    }
    if (!isAdmin) {
      setStoreMsg("You must be an admin to create stores.");
      return;
    }

    const payload = {
      name: storeName.trim(),
      address: storeAddress.trim() || null,
      city: storeCity.trim() || null,
      area: storeArea.trim() || null,
      phone: storePhone.trim() || null,
      pickup_notes: storeNotes.trim() || null,
    };

    const { error } = await supabase.from("stores").insert(payload);

    if (error) {
      setStoreMsg(`Error: ${error.message}`);
      return;
    }

    setStoreName("");
    setStoreAddress("");
    setStoreCity("");
    setStoreArea("");
    setStorePhone("");
    setStoreNotes("");
    setStoreMsg("Store created.");
    await refresh();
  }

  async function createDeal() {
    setDealMsg(null);

    if (!isAdmin) {
      setDealMsg("You must be an admin to create deals.");
      return;
    }
    if (!dealStoreId) {
      setDealMsg("Pick a store.");
      return;
    }
    if (!dealTitle.trim()) {
      setDealMsg("Deal title is required.");
      return;
    }

    const dealPriceNum = Number(dealPrice);
    const dealQtyNum = Number(dealQty);
    const originalNum = dealOriginal.trim() ? Number(dealOriginal) : null;

    if (!Number.isFinite(dealPriceNum) || dealPriceNum <= 0) {
      setDealMsg("Deal price must be a valid number > 0.");
      return;
    }
    if (!Number.isFinite(dealQtyNum) || dealQtyNum <= 0) {
      setDealMsg("Quantity must be a valid number > 0.");
      return;
    }
    if (originalNum !== null && (!Number.isFinite(originalNum) || originalNum <= 0)) {
      setDealMsg("Original price must be empty or a valid number > 0.");
      return;
    }

    const payload = {
      store_id: dealStoreId,
      title: dealTitle.trim(),
      description: dealDesc.trim() || null,
      original_price: originalNum,
      deal_price: dealPriceNum,
      quantity_total: Math.floor(dealQtyNum),
      pickup_start: toIsoOrNull(pickupStart),
      pickup_end: toIsoOrNull(pickupEnd),
      expires_at: toIsoOrNull(expiresAt),
      is_active: true,
    };

    // Quick sanity: if pickup_end exists, but pickup_start doesn't
    if (payload.pickup_end && !payload.pickup_start) {
      setDealMsg("If you set pickup_end, also set pickup_start.");
      return;
    }

    const { error } = await supabase.from("deals").insert(payload);

    if (error) {
      setDealMsg(`Error: ${error.message}`);
      return;
    }

    setDealTitle("");
    setDealDesc("");
    setDealOriginal("");
    setDealPrice("");
    setDealQty("10");
    setPickupStart("");
    setPickupEnd("");
    setExpiresAt("");
    setDealMsg("Deal created.");
    await refresh();
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <div className="text-gray-600">Signed in as</div>
          <div className="font-medium">{sessionEmail ?? "—"}</div>
          <div className="text-xs text-gray-500 mt-1">Admin: {isAdmin ? "Yes" : "No"}</div>
        </div>
        <button onClick={signOut} className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
          Sign out
        </button>
      </div>

      {authMsg ? (
        <div className="rounded-2xl border p-5 text-sm text-gray-700">
          {authMsg}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-gray-600">Loading…</div>
      ) : null}

      {isAdmin ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Create Store */}
          <div className="rounded-2xl border p-6">
            <h2 className="font-semibold">Create Store</h2>
            <div className="mt-4 grid gap-3">
              <input className="rounded-xl border px-3 py-2" placeholder="Store name *" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
              <input className="rounded-xl border px-3 py-2" placeholder="Address" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="rounded-xl border px-3 py-2" placeholder="City (e.g., Makati)" value={storeCity} onChange={(e) => setStoreCity(e.target.value)} />
                <input className="rounded-xl border px-3 py-2" placeholder="Area (e.g., Legazpi)" value={storeArea} onChange={(e) => setStoreArea(e.target.value)} />
              </div>
              <input className="rounded-xl border px-3 py-2" placeholder="Phone" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} />
              <textarea className="rounded-xl border px-3 py-2" placeholder="Pickup notes (optional)" rows={3} value={storeNotes} onChange={(e) => setStoreNotes(e.target.value)} />
              <button onClick={createStore} className="rounded-xl bg-black text-white px-4 py-2 text-sm">
                Create store
              </button>
              {storeMsg ? <div className="text-xs text-gray-600">{storeMsg}</div> : null}
            </div>
          </div>

          {/* Create Deal */}
          <div className="rounded-2xl border p-6">
            <h2 className="font-semibold">Create Deal</h2>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm">
                Store *
                <select
                  className="rounded-xl border px-3 py-2"
                  value={dealStoreId}
                  onChange={(e) => setDealStoreId(e.target.value)}
                >
                  <option value="">Select a store…</option>
                  {sortedStores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.city ? `(${s.city}${s.area ? ` - ${s.area}` : ""})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <input className="rounded-xl border px-3 py-2" placeholder="Deal title * (e.g., Surprise pastry bag)" value={dealTitle} onChange={(e) => setDealTitle(e.target.value)} />
              <textarea className="rounded-xl border px-3 py-2" placeholder="Description" rows={3} value={dealDesc} onChange={(e) => setDealDesc(e.target.value)} />

              <div className="grid gap-3 sm:grid-cols-3">
                <input className="rounded-xl border px-3 py-2" placeholder="Original (optional)" value={dealOriginal} onChange={(e) => setDealOriginal(e.target.value)} />
                <input className="rounded-xl border px-3 py-2" placeholder="Deal price *" value={dealPrice} onChange={(e) => setDealPrice(e.target.value)} />
                <input className="rounded-xl border px-3 py-2" placeholder="Qty total *" value={dealQty} onChange={(e) => setDealQty(e.target.value)} />
              </div>

              <div className="grid gap-3">
                <div className="text-xs text-gray-500">
                  Dates: paste a date/time string your browser understands (e.g. <span className="font-mono">2026-02-21 19:30</span>).
                  Leave blank if unsure for now.
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input className="rounded-xl border px-3 py-2" placeholder="Pickup start (optional)" value={pickupStart} onChange={(e) => setPickupStart(e.target.value)} />
                  <input className="rounded-xl border px-3 py-2" placeholder="Pickup end (optional)" value={pickupEnd} onChange={(e) => setPickupEnd(e.target.value)} />
                </div>
                <input className="rounded-xl border px-3 py-2" placeholder="Expires at (optional)" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>

              <button onClick={createDeal} className="rounded-xl bg-black text-white px-4 py-2 text-sm">
                Create deal
              </button>
              {dealMsg ? <div className="text-xs text-gray-600">{dealMsg}</div> : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Recent lists */}
      {isAdmin ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border p-6">
            <h3 className="font-semibold">Recent Stores</h3>
            <div className="mt-3 space-y-3">
              {stores.length === 0 ? (
                <div className="text-sm text-gray-600">No stores yet.</div>
              ) : (
                stores.slice(0, 8).map((s) => (
                  <div key={s.id} className="text-sm">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-gray-600">
                      {(s.city ?? "—")}{s.area ? `, ${s.area}` : ""} • {s.phone ?? "—"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border p-6">
            <h3 className="font-semibold">Recent Deals</h3>
            <div className="mt-3 space-y-3">
              {deals.length === 0 ? (
                <div className="text-sm text-gray-600">No deals yet.</div>
              ) : (
                deals.slice(0, 8).map((d) => (
                  <div key={d.id} className="text-sm">
                    <div className="font-medium">{d.title}</div>
                    <div className="text-gray-600">
                      Store ID: <span className="font-mono text-xs">{d.store_id}</span>
                    </div>
                    <div className="text-gray-600">
                      Price: {d.deal_price} • Qty: {d.quantity_total} • Active: {d.is_active ? "Yes" : "No"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}