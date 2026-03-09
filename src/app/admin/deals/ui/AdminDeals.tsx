"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Copy, ExternalLink, ToggleLeft, ToggleRight } from "lucide-react";
import { formatMoney, formatDateTime } from "@/lib/utils";

type DealRow = {
  id: string;
  store_id: string;
  store_name: string;
  title: string;
  description: string | null;
  deal_price: number;
  original_price: number | null;
  quantity_total: number;
  quantity_reserved: number;
  quantity_remaining: number | null;
  is_active: boolean;
  expires_at: string | null;
  pickup_start: string | null;
  pickup_end: string | null;
  created_at: string;
};

export default function AdminDeals() {
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [q, setQ] = useState("");
  const [onlyActive, setOnlyActive] = useState<boolean | null>(null); // null=all
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    setMsg(null);
    setLoading(true);

    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session?.user) {
      setMsg("Not signed in. Go to /admin and sign in as admin.");
      setDeals([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("deals_with_remaining")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      setMsg(`Could not load deals: ${error.message}`);
      setDeals([]);
      setLoading(false);
      return;
    }

    setDeals((data ?? []) as DealRow[]);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = deals;
    if (onlyActive !== null) list = list.filter((d) => d.is_active === onlyActive);
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter((d) => {
      const hay = `${d.title} ${d.store_name} ${d.description ?? ""}`.toLowerCase();
      return hay.includes(t);
    });
  }, [deals, q, onlyActive]);

  async function toggleActive(id: string, next: boolean) {
    setMsg(null);
    const { error } = await supabase.from("deals").update({ is_active: next }).eq("id", id);
    if (error) return setMsg(`Update failed: ${error.message}`);
    await refresh();
    setMsg(next ? "Deal activated." : "Deal deactivated.");
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMsg("Copied.");
    } catch {
      setMsg("Could not copy.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-extrabold">All deals</div>
            <div className="text-sm muted mt-1">
              Search, toggle active state, and open public deal pages.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className={`btn ${onlyActive === null ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setOnlyActive(null)}
              type="button"
            >
              All
            </button>
            <button
              className={`btn ${onlyActive === true ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setOnlyActive(true)}
              type="button"
            >
              Active
            </button>
            <button
              className={`btn ${onlyActive === false ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setOnlyActive(false)}
              type="button"
            >
              Inactive
            </button>

            <button className="btn btn-ghost" onClick={refresh} disabled={loading} type="button">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Refresh</> : "Refresh"}
            </button>
          </div>
        </div>

        <input
          className="input mt-4"
          placeholder="Search title, store, description…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {msg ? <div className="card-soft p-4 text-sm">{msg}</div> : null}

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="card p-6 text-sm muted">No deals found.</div>
        ) : (
          filtered.map((d) => {
            const remaining =
              d.quantity_remaining ?? (d.quantity_total - d.quantity_reserved);
            return (
              <div key={d.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm muted truncate">{d.store_name}</div>
                    <div className="text-lg font-extrabold tracking-tight truncate">
                      {d.title}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="chip">Remaining: {Math.max(0, remaining)}</span>
                      <span className="chip">
                        {d.is_active ? "Active ✅" : "Inactive ❌"}
                      </span>
                      {d.expires_at ? (
                        <span className="chip">Expires: {formatDateTime(d.expires_at)}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-extrabold">{formatMoney(d.deal_price)}</div>
                    {d.original_price ? (
                      <div className="text-xs muted line-through">
                        {formatMoney(d.original_price)}
                      </div>
                    ) : (
                      <div className="text-xs muted">&nbsp;</div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2 justify-end">
                      <button
                        className="btn btn-ghost"
                        onClick={() => copy(d.id)}
                        type="button"
                      >
                        <Copy size={16} /> Copy ID
                      </button>

                      <a className="btn btn-ghost" href={`/deals/${d.id}`} target="_blank" rel="noreferrer">
                        <ExternalLink size={16} /> Open
                      </a>

                      <button
                        className="btn btn-ghost"
                        onClick={() => toggleActive(d.id, !d.is_active)}
                        type="button"
                      >
                        {d.is_active ? <><ToggleLeft size={18} /> Deactivate</> : <><ToggleRight size={18} /> Activate</>}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="divider my-4" />

                <div className="grid gap-2 md:grid-cols-2 text-sm">
                  <div className="card-soft p-4">
                    <div className="text-xs muted">Pickup window</div>
                    <div className="font-semibold mt-1">
                      {formatDateTime(d.pickup_start)} – {formatDateTime(d.pickup_end)}
                    </div>
                  </div>
                  <div className="card-soft p-4">
                    <div className="text-xs muted">Created</div>
                    <div className="font-semibold mt-1">{formatDateTime(d.created_at)}</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}