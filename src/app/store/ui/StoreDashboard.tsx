"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { removePublicImage, uploadPublicImage } from "@/lib/storage";

type Store = {
  id: string;
  name: string;
  city: string | null;
  area: string | null;
  address: string | null;
  phone: string | null;
  pickup_notes: string | null;
  image_url: string | null;
};

type Deal = {
  id: string;
  title: string;
  description: string | null;
  original_price: number | null;
  deal_price: number;
  quantity_total: number;
  quantity_reserved: number;
  is_active: boolean;
  pickup_start: string | null;
  pickup_end: string | null;
  expires_at: string | null;
  created_at: string;
  image_url: string | null;
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

type DealEditor = {
  title: string;
  description: string;
  original_price: string;
  deal_price: string;
  quantity_total: string;
  pickup_start: string;
  pickup_end: string;
  expires_at: string;
};

function toIsoOrNull(v: string) {
  const t = v.trim();
  if (!t) return null;
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toLocalInputValue(v: string | null) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const tzOffsetMs = d.getTimezoneOffset() * 60 * 1000;
  const local = new Date(d.getTime() - tzOffsetMs);
  return local.toISOString().slice(0, 16);
}

function dealToEditor(d: Deal): DealEditor {
  return {
    title: d.title ?? "",
    description: d.description ?? "",
    original_price: d.original_price?.toString() ?? "",
    deal_price: d.deal_price?.toString() ?? "",
    quantity_total: d.quantity_total?.toString() ?? "",
    pickup_start: toLocalInputValue(d.pickup_start),
    pickup_end: toLocalInputValue(d.pickup_end),
    expires_at: toLocalInputValue(d.expires_at),
  };
}

export default function StoreDashboard({ onSignedOut }: { onSignedOut?: () => void }) {
  const [email, setEmail] = useState<string | null>(null);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const [deals, setDeals] = useState<Deal[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const [isCreatingDeal, setIsCreatingDeal] = useState(false);
  const [storeLogoBusy, setStoreLogoBusy] = useState(false);
  const [dealImageBusyId, setDealImageBusyId] = useState<string | null>(null);
  const [savingDealId, setSavingDealId] = useState<string | null>(null);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [dealEdits, setDealEdits] = useState<Record<string, DealEditor>>({});

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [original, setOriginal] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("10");
  const [pickupStart, setPickupStart] = useState("");
  const [pickupEnd, setPickupEnd] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [newDealImageFile, setNewDealImageFile] = useState<File | null>(null);

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
        setDealEdits({});
        setMsg("You are signed out. Please sign in again.");
        return;
      }

      setEmail(user.email ?? null);

      const { data: myStore, error: storeErr } = await supabase.rpc("my_store_id");
      if (storeErr) throw storeErr;

      if (!myStore) {
        setStoreId(null);
        setStore(null);
        setDeals([]);
        setReservations([]);
        setDealEdits({});
        setMsg(
          "Your account is not linked to a store yet. Ask admin to link you, or sign in again after your application is approved."
        );
        return;
      }

      setStoreId(myStore);

      const { data: storeRow, error: storeRowErr } = await supabase
        .from("stores")
        .select("id,name,city,area,address,phone,pickup_notes,image_url")
        .eq("id", myStore)
        .single();
      if (storeRowErr) throw storeRowErr;
      setStore(storeRow);

      const { data: dealsData, error: dealsErr } = await supabase
        .from("deals")
        .select(
          "id,title,description,original_price,deal_price,quantity_total,quantity_reserved,is_active,pickup_start,pickup_end,expires_at,created_at,image_url"
        )
        .eq("store_id", myStore)
        .order("created_at", { ascending: false })
        .limit(100);
      if (dealsErr) throw dealsErr;

      const nextDeals = (dealsData ?? []) as Deal[];
      setDeals(nextDeals);
      setDealEdits(Object.fromEntries(nextDeals.map((d) => [d.id, dealToEditor(d)])));

      const dealIds = nextDeals.map((d) => d.id);
      if (dealIds.length === 0) {
        setReservations([]);
      } else {
        const { data: resData, error: resErr } = await supabase
          .from("reservations")
          .select("id,deal_id,user_email,qty,code,status,created_at")
          .in("deal_id", dealIds)
          .order("created_at", { ascending: false })
          .limit(200);
        if (resErr) throw resErr;
        setReservations((resData ?? []) as Reservation[]);
      }
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
    if (origNum !== null && (!Number.isFinite(origNum) || origNum <= 0)) {
      return setMsg("Original price must be blank or > 0.");
    }

    const expiresIso =
      toIsoOrNull(expiresAt) ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    setIsCreatingDeal(true);

    try {
      let imageUrl: string | null = null;

      if (newDealImageFile) {
        imageUrl = await uploadPublicImage("deal-images", newDealImageFile, `stores/${storeId}`);
      }

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
        image_url: imageUrl,
      };

      const { error } = await supabase.from("deals").insert(payload);
      if (error) throw error;

      setTitle("");
      setDesc("");
      setOriginal("");
      setPrice("");
      setQty("10");
      setPickupStart("");
      setPickupEnd("");
      setExpiresAt("");
      setNewDealImageFile(null);
      setMsg("Deal created.");
      await refresh();
    } catch (e: any) {
      setMsg(`Create deal failed: ${e?.message ?? "Unknown error"}`);
    } finally {
      setIsCreatingDeal(false);
    }
  }

  async function toggleDeal(dealId: string, next: boolean) {
    setMsg(null);
    const { error } = await supabase.from("deals").update({ is_active: next }).eq("id", dealId);
    if (error) return setMsg(`Update failed: ${error.message}`);
    await refresh();
  }

  async function saveDeal(dealId: string) {
    const edit = dealEdits[dealId];
    if (!edit) return;

    setMsg(null);
    setSavingDealId(dealId);

    try {
      if (!edit.title.trim()) throw new Error("Title is required.");

      const dealPrice = Number(edit.deal_price);
      const quantityTotal = Number(edit.quantity_total);
      const originalPrice = edit.original_price.trim() ? Number(edit.original_price) : null;

      if (!Number.isFinite(dealPrice) || dealPrice <= 0) {
        throw new Error("Deal price must be greater than 0.");
      }
      if (!Number.isFinite(quantityTotal) || quantityTotal <= 0) {
        throw new Error("Quantity total must be greater than 0.");
      }
      if (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice <= 0)) {
        throw new Error("Original price must be blank or greater than 0.");
      }

      const payload = {
        title: edit.title.trim(),
        description: edit.description.trim() || null,
        original_price: originalPrice,
        deal_price: dealPrice,
        quantity_total: Math.floor(quantityTotal),
        pickup_start: toIsoOrNull(edit.pickup_start),
        pickup_end: toIsoOrNull(edit.pickup_end),
        expires_at: toIsoOrNull(edit.expires_at),
      };

      const { error } = await supabase.from("deals").update(payload).eq("id", dealId);
      if (error) throw error;

      setEditingDealId(null);
      setMsg("Deal updated.");
      await refresh();
    } catch (e: any) {
      setMsg(`Save failed: ${e?.message ?? "Unknown error"}`);
    } finally {
      setSavingDealId(null);
    }
  }

  function startEditing(d: Deal) {
    setDealEdits((prev) => ({ ...prev, [d.id]: dealToEditor(d) }));
    setEditingDealId(d.id);
  }

  function cancelEditing(d: Deal) {
    setDealEdits((prev) => ({ ...prev, [d.id]: dealToEditor(d) }));
    setEditingDealId((current) => (current === d.id ? null : current));
  }

  function updateDealEdit(dealId: string, patch: Partial<DealEditor>) {
    setDealEdits((prev) => ({
      ...prev,
      [dealId]: {
        ...(prev[dealId] ?? {
          title: "",
          description: "",
          original_price: "",
          deal_price: "",
          quantity_total: "",
          pickup_start: "",
          pickup_end: "",
          expires_at: "",
        }),
        ...patch,
      },
    }));
  }

  async function markPickedUp(resId: string) {
    setMsg(null);
    const { error } = await supabase
      .from("reservations")
      .update({ status: "picked_up" })
      .eq("id", resId);
    if (error) return setMsg(`Update failed: ${error.message}`);
    await refresh();
  }

  async function uploadStoreLogo(file: File) {
    if (!storeId || !store) return;
    setMsg(null);
    setStoreLogoBusy(true);

    try {
      const nextUrl = await uploadPublicImage("store-images", file, `stores/${storeId}`);

      const { error } = await supabase
        .from("stores")
        .update({ image_url: nextUrl })
        .eq("id", storeId);
      if (error) throw error;

      if (store.image_url && store.image_url !== nextUrl) {
        await removePublicImage("store-images", store.image_url).catch(() => {});
      }

      setMsg("Store logo updated.");
      await refresh();
    } catch (e: any) {
      setMsg(`Store logo upload failed: ${e?.message ?? "Unknown error"}`);
    } finally {
      setStoreLogoBusy(false);
    }
  }

  async function removeStoreLogo() {
    if (!storeId || !store?.image_url) return;
    setMsg(null);
    setStoreLogoBusy(true);

    try {
      const oldUrl = store.image_url;
      const { error } = await supabase.from("stores").update({ image_url: null }).eq("id", storeId);
      if (error) throw error;

      await removePublicImage("store-images", oldUrl).catch(() => {});
      setMsg("Store logo removed.");
      await refresh();
    } catch (e: any) {
      setMsg(`Remove store logo failed: ${e?.message ?? "Unknown error"}`);
    } finally {
      setStoreLogoBusy(false);
    }
  }

  async function uploadDealImage(dealId: string, currentUrl: string | null, file: File) {
    if (!storeId) return;
    setMsg(null);
    setDealImageBusyId(dealId);

    try {
      const nextUrl = await uploadPublicImage("deal-images", file, `stores/${storeId}`);

      const { error } = await supabase.from("deals").update({ image_url: nextUrl }).eq("id", dealId);
      if (error) throw error;

      if (currentUrl && currentUrl !== nextUrl) {
        await removePublicImage("deal-images", currentUrl).catch(() => {});
      }

      setMsg("Deal image updated.");
      await refresh();
    } catch (e: any) {
      setMsg(`Deal image upload failed: ${e?.message ?? "Unknown error"}`);
    } finally {
      setDealImageBusyId(null);
    }
  }

  async function removeDealImage(dealId: string, currentUrl: string | null) {
    if (!currentUrl) return;
    setMsg(null);
    setDealImageBusyId(dealId);

    try {
      const { error } = await supabase.from("deals").update({ image_url: null }).eq("id", dealId);
      if (error) throw error;

      await removePublicImage("deal-images", currentUrl).catch(() => {});
      setMsg("Deal image removed.");
      await refresh();
    } catch (e: any) {
      setMsg(`Remove deal image failed: ${e?.message ?? "Unknown error"}`);
    } finally {
      setDealImageBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card relative z-10 flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="text-sm">
          <div className="muted">Signed in as</div>
          <div className="font-medium">{loading ? "Loading…" : email ?? "—"}</div>

          <div className="mt-1 muted">
            {loading ? "Store: Loading…" : store ? `Store: ${store.name}` : "Store: —"}
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

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="card p-6">
          <h2 className="font-semibold">Create a deal</h2>
          <p className="mt-1 text-sm muted">
            Add a photo if you want. Leave date fields blank if you’re unsure. Expiry defaults to
            24h.
          </p>

          <div className="mt-4 grid max-w-2xl gap-3">
            <input
              className="rounded-xl border px-3 py-2 ring-focus"
              placeholder="Title (e.g., Surprise Pastry Bag)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="rounded-xl border px-3 py-2 ring-focus"
              rows={3}
              placeholder="Description (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <input
                className="rounded-xl border px-3 py-2 ring-focus"
                placeholder="Original price (optional)"
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
              />
              <input
                className="rounded-xl border px-3 py-2 ring-focus"
                placeholder="Deal price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <input
                className="rounded-xl border px-3 py-2 ring-focus"
                placeholder="Qty total"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="datetime-local"
                className="rounded-xl border px-3 py-2 ring-focus"
                placeholder="Pickup start"
                value={pickupStart}
                onChange={(e) => setPickupStart(e.target.value)}
              />
              <input
                type="datetime-local"
                className="rounded-xl border px-3 py-2 ring-focus"
                placeholder="Pickup end"
                value={pickupEnd}
                onChange={(e) => setPickupEnd(e.target.value)}
              />
            </div>

            <input
              type="datetime-local"
              className="rounded-xl border px-3 py-2 ring-focus"
              placeholder="Expires at (optional)"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium">Deal photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                className="rounded-xl border px-3 py-2 ring-focus"
                onChange={(e) => setNewDealImageFile(e.target.files?.[0] ?? null)}
              />
              {newDealImageFile ? (
                <div className="text-xs muted">Selected: {newDealImageFile.name}</div>
              ) : null}
            </div>

            <button className="btn btn-primary ring-focus w-fit" onClick={createDeal} disabled={isCreatingDeal}>
              {isCreatingDeal ? "Publishing…" : "Publish deal"}
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold">Storefront logo</h2>
          <p className="mt-1 text-sm muted">
            Upload a logo for your storefront and future store cards.
          </p>

          <div className="mt-4 space-y-4">
            <div
              className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl border bg-white"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              {store?.image_url ? (
                <img src={store.image_url} alt={store.name} className="h-full w-full object-cover" />
              ) : (
                <div className="text-center text-sm muted">No logo yet</div>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              className="rounded-xl border px-3 py-2 ring-focus"
              disabled={storeLogoBusy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadStoreLogo(file);
              }}
            />

            <div className="flex flex-wrap gap-2">
              <button
                className="btn btn-outline ring-focus"
                disabled={storeLogoBusy || !store?.image_url}
                onClick={removeStoreLogo}
              >
                {storeLogoBusy ? "Working…" : "Remove logo"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="font-semibold">Your deals</h3>
          <div className="mt-4 space-y-4">
            {deals.length === 0 ? (
              <div className="text-sm muted">No deals yet.</div>
            ) : (
              deals.map((d) => {
                const remaining = d.quantity_total - d.quantity_reserved;
                const busy = dealImageBusyId === d.id;
                const isEditing = editingDealId === d.id;
                const isSaving = savingDealId === d.id;
                const edit = dealEdits[d.id] ?? dealToEditor(d);

                return (
                  <div
                    key={d.id}
                    className="rounded-2xl border p-4"
                    style={{ borderColor: "hsl(var(--border))" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{d.title}</div>
                        <div className="text-sm muted">₱{d.deal_price} • Remaining {remaining}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {!isEditing ? (
                          <button className="btn btn-outline ring-focus" onClick={() => startEditing(d)}>
                            Edit
                          </button>
                        ) : (
                          <>
                            <button className="btn btn-outline ring-focus" onClick={() => cancelEditing(d)}>
                              Cancel
                            </button>
                            <button
                              className="btn btn-primary ring-focus"
                              onClick={() => saveDeal(d.id)}
                              disabled={isSaving}
                            >
                              {isSaving ? "Saving…" : "Save"}
                            </button>
                          </>
                        )}
                        <button
                          className="btn btn-outline ring-focus"
                          onClick={() => toggleDeal(d.id, !d.is_active)}
                        >
                          {d.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[120px_1fr]">
                      <div
                        className="flex h-[100px] w-[120px] items-center justify-center overflow-hidden rounded-xl border bg-white"
                        style={{ borderColor: "hsl(var(--border))" }}
                      >
                        {d.image_url ? (
                          <img src={d.image_url} alt={d.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="text-center text-xs muted">No image</div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="text-xs muted">
                          Reservations: {(reservationsByDeal.get(d.id) ?? []).length}
                        </div>

                        {isEditing ? (
                          <div className="grid gap-3">
                            <input
                              className="rounded-xl border px-3 py-2 ring-focus"
                              value={edit.title}
                              onChange={(e) => updateDealEdit(d.id, { title: e.target.value })}
                              placeholder="Title"
                            />
                            <textarea
                              className="rounded-xl border px-3 py-2 ring-focus"
                              rows={3}
                              value={edit.description}
                              onChange={(e) => updateDealEdit(d.id, { description: e.target.value })}
                              placeholder="Description"
                            />
                            <div className="grid gap-3 sm:grid-cols-3">
                              <input
                                className="rounded-xl border px-3 py-2 ring-focus"
                                value={edit.original_price}
                                onChange={(e) => updateDealEdit(d.id, { original_price: e.target.value })}
                                placeholder="Original price"
                              />
                              <input
                                className="rounded-xl border px-3 py-2 ring-focus"
                                value={edit.deal_price}
                                onChange={(e) => updateDealEdit(d.id, { deal_price: e.target.value })}
                                placeholder="Deal price"
                              />
                              <input
                                className="rounded-xl border px-3 py-2 ring-focus"
                                value={edit.quantity_total}
                                onChange={(e) => updateDealEdit(d.id, { quantity_total: e.target.value })}
                                placeholder="Qty total"
                              />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <input
                                type="datetime-local"
                                className="rounded-xl border px-3 py-2 ring-focus"
                                value={edit.pickup_start}
                                onChange={(e) => updateDealEdit(d.id, { pickup_start: e.target.value })}
                              />
                              <input
                                type="datetime-local"
                                className="rounded-xl border px-3 py-2 ring-focus"
                                value={edit.pickup_end}
                                onChange={(e) => updateDealEdit(d.id, { pickup_end: e.target.value })}
                              />
                            </div>
                            <input
                              type="datetime-local"
                              className="rounded-xl border px-3 py-2 ring-focus"
                              value={edit.expires_at}
                              onChange={(e) => updateDealEdit(d.id, { expires_at: e.target.value })}
                              placeholder="Expires at"
                            />
                          </div>
                        ) : (
                          <div className="grid gap-1 text-sm">
                            <div className="muted">Original price: {d.original_price ? `₱${d.original_price}` : "—"}</div>
                            <div className="muted">Pickup start: {d.pickup_start ? new Date(d.pickup_start).toLocaleString() : "—"}</div>
                            <div className="muted">Pickup end: {d.pickup_end ? new Date(d.pickup_end).toLocaleString() : "—"}</div>
                            <div className="muted">Expires: {d.expires_at ? new Date(d.expires_at).toLocaleString() : "—"}</div>
                            <div className="muted whitespace-pre-wrap">{d.description || "No description"}</div>
                          </div>
                        )}

                        <input
                          type="file"
                          accept="image/*"
                          className="rounded-xl border px-3 py-2 ring-focus text-sm"
                          disabled={busy}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void uploadDealImage(d.id, d.image_url, file);
                          }}
                        />

                        <div className="flex flex-wrap gap-2">
                          <button
                            className="btn btn-outline ring-focus"
                            disabled={busy || !d.image_url}
                            onClick={() => removeDealImage(d.id, d.image_url)}
                          >
                            {busy ? "Working…" : "Remove image"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold">Recent reservations</h3>
          <div className="mt-4 space-y-3">
            {reservations.length === 0 ? (
              <div className="text-sm muted">No reservations yet.</div>
            ) : (
              reservations.slice(0, 12).map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border p-4"
                  style={{ borderColor: "hsl(var(--border))" }}
                >
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
        Store link not working? Ask admin to approve the application tied to your email, then sign in again.
      </div>
    </div>
  );
}