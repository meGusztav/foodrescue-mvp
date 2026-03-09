"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Copy, Loader2, MapPin, Phone, Store as StoreIcon, Users } from "lucide-react";

type StoreRow = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  area: string | null;
  phone: string | null;
  pickup_notes: string | null;
  created_at?: string;
};

type StoreUser = {
  id: string;
  store_id: string;
  user_id: string;
  role: string;
  created_at: string;
};

export default function AdminStores() {
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [links, setLinks] = useState<StoreUser[]>([]);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const selected = useMemo(
    () => stores.find((s) => s.id === selectedId) ?? null,
    [stores, selectedId]
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return stores;
    return stores.filter((s) => {
      const hay = `${s.name} ${s.city ?? ""} ${s.area ?? ""} ${s.address ?? ""}`.toLowerCase();
      return hay.includes(t);
    });
  }, [stores, q]);

  const linksForSelected = useMemo(() => {
    if (!selectedId) return [];
    return links.filter((l) => l.store_id === selectedId);
  }, [links, selectedId]);

  async function refresh() {
    setMsg(null);
    setLoading(true);

    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.user) {
      setMsg("Not signed in. Go to /admin and sign in as admin.");
      setStores([]);
      setLinks([]);
      setSelectedId(null);
      setLoading(false);
      return;
    }

    const { data: sData, error: sErr } = await supabase
      .from("stores")
      .select("id,name,address,city,area,phone,pickup_notes,created_at")
      .order("created_at", { ascending: false });

    if (sErr) {
      setMsg(`Could not load stores: ${sErr.message}`);
      setStores([]);
      setLoading(false);
      return;
    }

    const { data: lData, error: lErr } = await supabase
      .from("store_users")
      .select("id,store_id,user_id,role,created_at")
      .order("created_at", { ascending: false });

    if (lErr) {
      // If you didn’t enable admin read policy earlier, this will fail.
      setMsg(`Could not load store links: ${lErr.message}`);
      setLinks([]);
    } else {
      setLinks((lData ?? []) as StoreUser[]);
    }

    const list = (sData ?? []) as StoreRow[];
    setStores(list);
    setSelectedId((prev) => prev ?? list[0]?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMsg("Copied.");
    } catch {
      setMsg("Could not copy.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
      {/* Left list */}
      <div className="lg:col-span-2">
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold">All stores</div>
            <button className="btn btn-ghost" onClick={refresh} disabled={loading}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Refresh</> : "Refresh"}
            </button>
          </div>

          <input
            className="input mt-4"
            placeholder="Search store, city, area…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <div className="mt-4 space-y-2">
            {filtered.length === 0 ? (
              <div className="text-sm muted">No stores.</div>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full text-left rounded-3xl border px-4 py-3 transition ${
                    s.id === selectedId ? "bg-black/5" : "hover:bg-black/5"
                  }`}
                  style={{ borderColor: "hsl(var(--border))" }}
                >
                  <div className="font-extrabold truncate">{s.name}</div>
                  <div className="text-xs muted mt-1 truncate">
                    {(s.area ?? "—")}{s.city ? `, ${s.city}` : ""}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {msg ? <div className="mt-4 card-soft p-4 text-sm">{msg}</div> : null}
      </div>

      {/* Right details */}
      <div className="lg:col-span-3 space-y-4">
        {!selected ? (
          <div className="card p-6 text-sm muted">Select a store.</div>
        ) : (
          <>
            <div className="card p-6 md:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm muted">Store</div>
                  <div className="text-2xl font-extrabold tracking-tight">{selected.name}</div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="chip">
                      <StoreIcon size={14} /> ID: {selected.id.slice(0, 8)}…
                    </span>
                    <button className="chip" onClick={() => copy(selected.id)} type="button">
                      <Copy size={14} /> Copy UUID
                    </button>
                  </div>
                </div>

                <div className="card-soft p-4">
                  <div className="text-xs muted">Linked users</div>
                  <div className="text-lg font-extrabold">{linksForSelected.length}</div>
                </div>
              </div>

              <div className="divider my-5" />

              <div className="grid gap-4 md:grid-cols-2 text-sm">
                <div className="card-soft p-5">
                  <div className="font-extrabold flex items-center gap-2">
                    <MapPin size={16} /> Location
                  </div>
                  <div className="mt-2 muted">
                    {selected.address ?? "—"}
                    <br />
                    {(selected.area ?? "—") + (selected.city ? `, ${selected.city}` : "")}
                  </div>
                </div>

                <div className="card-soft p-5">
                  <div className="font-extrabold flex items-center gap-2">
                    <Phone size={16} /> Contact
                  </div>
                  <div className="mt-2 muted">{selected.phone ?? "—"}</div>
                </div>

                <div className="md:col-span-2 card-soft p-5">
                  <div className="font-extrabold">Pickup notes</div>
                  <div className="mt-2 muted whitespace-pre-wrap">
                    {selected.pickup_notes ?? "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6 md:p-7">
              <div className="text-sm font-extrabold flex items-center gap-2">
                <Users size={16} /> Store users
              </div>
              <div className="text-sm muted mt-1">
                Linked accounts can post deals for this store.
              </div>

              <div className="mt-4 space-y-2">
                {linksForSelected.length === 0 ? (
                  <div className="text-sm muted">No users linked yet.</div>
                ) : (
                  linksForSelected.map((l) => (
                    <div
                      key={l.id}
                      className="rounded-3xl border p-4 flex flex-wrap items-center justify-between gap-3"
                      style={{ borderColor: "hsl(var(--border))" }}
                    >
                      <div>
                        <div className="text-sm font-semibold">User UUID</div>
                        <div className="font-mono text-xs muted break-all">{l.user_id}</div>
                      </div>
                      <span className="chip">{l.role}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 card-soft p-4 text-xs">
                To link a user, insert into <span className="font-mono">store_users</span> (or we’ll automate invite-by-email next).
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}