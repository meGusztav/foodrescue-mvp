"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Copy,
  Loader2,
  Phone,
  Mail,
  Store,
  MapPin,
  Clock,
  XCircle,
} from "lucide-react";

type Application = {
  id: string;
  store_name: string;
  address: string | null;
  city: string | null;
  area: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  pickup_notes: string | null;
  est_daily_bags: number | null;
  status: "new" | "contacted" | "approved" | "rejected" | string;
  created_at: string;
};

type StoreRow = {
  id: string;
  name: string;
};

const STATUS_OPTIONS: Array<Application["status"]> = [
  "new",
  "contacted",
  "approved",
  "rejected",
];

function statusPill(status: string) {
  const base = "chip";
  if (status === "approved") return { className: base, label: "Approved ✅" };
  if (status === "contacted") return { className: base, label: "Contacted 📩" };
  if (status === "rejected") return { className: base, label: "Rejected ❌" };
  return { className: base, label: "New 🆕" };
}

export default function AdminApplications() {
  const [apps, setApps] = useState<Application[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Create store from application
  const [creating, setCreating] = useState(false);
  const [createdStore, setCreatedStore] = useState<StoreRow | null>(null);

  const selected = useMemo(
    () => apps.find((a) => a.id === selectedId) ?? null,
    [apps, selectedId]
  );

  async function refresh() {
    setMsg(null);
    setLoading(true);
    setCreatedStore(null);

    const { data: sess } = await supabase.auth.getSession();
    const user = sess.session?.user;

    if (!user) {
      setApps([]);
      setSelectedId(null);
      setMsg("You are not signed in. Go to /admin and sign in as admin.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("store_applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMsg(
        `Could not load applications: ${error.message}. (Are you signed in as admin?)`
      );
      setApps([]);
      setSelectedId(null);
      setLoading(false);
      return;
    }

    const list = (data ?? []) as Application[];
    setApps(list);
    setSelectedId(list[0]?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(id: string, status: Application["status"]) {
    setMsg(null);
    const { error } = await supabase
      .from("store_applications")
      .update({ status })
      .eq("id", id);

    if (error) return setMsg(`Update failed: ${error.message}`);
    await refresh();
    setSelectedId(id);
    setMsg(`Status updated to "${status}".`);
  }

  async function createStoreFromSelected() {
    if (!selected) return;
    setMsg(null);
    setCreating(true);
    setCreatedStore(null);

    try {
      // Insert into your existing stores table
      // Assumes columns: name,address,city,area,phone,pickup_notes
      const { data, error } = await supabase
        .from("stores")
        .insert({
          name: selected.store_name,
          address: selected.address,
          city: selected.city,
          area: selected.area,
          phone: selected.contact_phone,
          pickup_notes: selected.pickup_notes,
        })
        .select("id,name")
        .single();

      if (error) throw new Error(error.message);

      setCreatedStore(data as StoreRow);

      // Optionally auto-mark as contacted/approved — we’ll mark contacted to be safe
      await supabase
        .from("store_applications")
        .update({ status: "contacted" })
        .eq("id", selected.id);

      await refresh();
      setSelectedId(selected.id);
      setMsg("Store created. Next: link a store owner user to this store.");
    } catch (e: any) {
      setMsg(e?.message ?? "Create store failed.");
    } finally {
      setCreating(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMsg("Copied to clipboard.");
    } catch {
      setMsg("Could not copy. (Browser blocked clipboard)");
    }
  }

  const sqlSnippet = useMemo(() => {
    if (!createdStore?.id) return null;
    return `-- Link a store owner user to this store (run in Supabase SQL Editor)
insert into public.store_users (store_id, user_id, role)
values ('${createdStore.id}', 'PASTE_AUTH_USER_UUID_HERE', 'manager')
on conflict (store_id, user_id) do nothing;`;
  }, [createdStore]);

  return (
    <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
      {/* Left: list */}
      <div className="lg:col-span-2">
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold">Inbox</div>
            <button className="btn btn-ghost" onClick={refresh} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Refresh
                </>
              ) : (
                "Refresh"
              )}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {apps.length === 0 ? (
              <div className="text-sm muted">No applications yet.</div>
            ) : (
              apps.map((a) => {
                const pill = statusPill(a.status);
                const active = a.id === selectedId;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className={`w-full text-left rounded-3xl border px-4 py-3 transition ${
                      active ? "bg-black/5" : "hover:bg-black/5"
                    }`}
                    style={{ borderColor: "hsl(var(--border))" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-extrabold truncate">{a.store_name}</div>
                        <div className="text-xs muted mt-1 truncate">
                          {a.city ?? "—"}{a.area ? ` • ${a.area}` : ""}
                        </div>
                      </div>
                      <span className={pill.className}>{pill.label}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {msg ? (
          <div className="mt-4 card-soft p-4 text-sm">{msg}</div>
        ) : null}
      </div>

      {/* Right: detail */}
      <div className="lg:col-span-3 space-y-4">
        {!selected ? (
          <div className="card p-6 text-sm muted">Select an application.</div>
        ) : (
          <>
            <div className="card p-6 md:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm muted">Store</div>
                  <div className="text-2xl font-extrabold tracking-tight">
                    {selected.store_name}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="chip">
                      <Clock size={14} />
                      {new Date(selected.created_at).toLocaleString()}
                    </span>
                    {selected.est_daily_bags !== null ? (
                      <span className="chip">Est. bags/day: {selected.est_daily_bags}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      className="btn btn-ghost"
                      onClick={() => setStatus(selected.id, s)}
                    >
                      {s}
                    </button>
                  ))}
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
                  <div className="mt-2">
                    <div className="muted">
                      {selected.contact_name ? `${selected.contact_name} • ` : ""}
                      {selected.contact_phone ?? "—"}
                    </div>
                    <div className="muted mt-1 flex items-center gap-2">
                      <Mail size={14} />
                      {selected.contact_email ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 card-soft p-5">
                  <div className="font-extrabold">Pickup notes</div>
                  <div className="mt-2 muted whitespace-pre-wrap">
                    {selected.pickup_notes ?? "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Create store from application */}
            <div className="card p-6 md:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold flex items-center gap-2">
                    <Store size={16} /> Convert to store
                  </div>
                  <div className="text-sm muted mt-1">
                    This creates a row in <span className="font-mono">stores</span> using the application info.
                  </div>
                </div>

                <button
                  className="btn btn-primary shine"
                  onClick={createStoreFromSelected}
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Creating…
                    </>
                  ) : (
                    <>
                      Create store <CheckCircle2 size={16} />
                    </>
                  )}
                </button>
              </div>

              <AnimatePresence>
                {createdStore ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-5 card-soft p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-extrabold">Store created</div>
                        <div className="text-sm muted mt-1">
                          Store ID (UUID):
                        </div>
                        <div className="mt-2 font-mono text-sm break-all">
                          {createdStore.id}
                        </div>
                      </div>
                      <button className="btn btn-ghost" onClick={() => copy(createdStore.id)}>
                        <Copy size={16} /> Copy
                      </button>
                    </div>

                    {sqlSnippet ? (
                      <div className="mt-4">
                        <div className="text-sm font-extrabold">Next step: link store owner user</div>
                        <div className="text-sm muted mt-1">
                          Run this in Supabase SQL Editor once the store owner has created an account.
                        </div>

                        <pre
                          className="mt-3 rounded-3xl border p-4 overflow-auto text-xs"
                          style={{
                            borderColor: "hsl(var(--border))",
                            background: "hsl(var(--surface))",
                          }}
                        >
{sqlSnippet}
                        </pre>

                        <div className="mt-3 flex gap-2">
                          <button className="btn btn-ghost" onClick={() => copy(sqlSnippet)}>
                            <Copy size={16} /> Copy SQL
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="mt-4 text-xs muted flex items-center gap-2">
                <XCircle size={14} />
                Note: linking a store owner requires their Auth user UUID (we’ll automate this later with invite-by-email).
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}