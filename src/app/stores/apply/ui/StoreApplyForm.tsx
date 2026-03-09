"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, Loader2, Phone, Mail, Store, MapPin, Sparkles } from "lucide-react";

type FormState = {
  store_name: string;
  address: string;
  city: string;
  area: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  pickup_notes: string;
  est_daily_bags: string;
};

const initial: FormState = {
  store_name: "",
  address: "",
  city: "",
  area: "",
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  pickup_notes: "",
  est_daily_bags: "",
};

function isEmail(v: string) {
  if (!v.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function StoreApplyForm() {
  const [v, setV] = useState<FormState>(initial);
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!v.store_name.trim()) return false;
    if (!v.contact_phone.trim() && !v.contact_email.trim()) return false;
    if (!isEmail(v.contact_email)) return false;
    return true;
  }, [v]);

  function set<K extends keyof FormState>(k: K, val: FormState[K]) {
    setV((p) => ({ ...p, [k]: val }));
  }

  async function submit() {
    setErr(null);
    setOk(false);

    if (!canSubmit) {
      setErr("Please add your store name and at least one contact method (phone or email).");
      return;
    }
    if (!isEmail(v.contact_email)) {
      setErr("Please enter a valid email (or leave it blank).");
      return;
    }

    setLoading(true);
    try {
      const estBags = v.est_daily_bags.trim() ? Number(v.est_daily_bags) : null;
      if (estBags !== null && (!Number.isFinite(estBags) || estBags < 0)) {
        throw new Error("Estimated daily bags must be a number (or leave blank).");
      }

      const { error } = await supabase.from("store_applications").insert({
        store_name: v.store_name.trim(),
        address: v.address.trim() || null,
        city: v.city.trim() || null,
        area: v.area.trim() || null,
        contact_name: v.contact_name.trim() || null,
        contact_phone: v.contact_phone.trim() || null,
        contact_email: v.contact_email.trim() || null,
        pickup_notes: v.pickup_notes.trim() || null,
        est_daily_bags: estBags,
      });

      if (error) throw new Error(error.message);

      setOk(true);
      setV(initial);
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
      {/* Left: Form */}
      <div className="lg:col-span-3">
        <div className="card p-6 md:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-extrabold">Store details</div>
              <div className="text-sm muted mt-1">
                We’ll contact you within 24–48 hours to activate your store dashboard.
              </div>
            </div>
            <span className="chip">
              <Sparkles size={14} /> Fast onboarding
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <Store size={16} /> Store name <span className="muted font-normal">(required)</span>
              </label>
              <input className="input" placeholder="e.g., Joe’s Diner" value={v.store_name} onChange={(e) => set("store_name", e.target.value)} />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold flex items-center gap-2">
                <MapPin size={16} /> Address
              </label>
              <input className="input" placeholder="Street / building (optional)" value={v.address} onChange={(e) => set("address", e.target.value)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold">City</label>
                <input className="input" placeholder="e.g., Makati / Muntinlupa" value={v.city} onChange={(e) => set("city", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Area</label>
                <input className="input" placeholder="e.g., Legazpi / Alabang" value={v.area} onChange={(e) => set("area", e.target.value)} />
              </div>
            </div>

            <div className="divider" />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Contact person</label>
                <input className="input" placeholder="Name (optional)" value={v.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Estimated bundles per day</label>
                <input className="input" placeholder="e.g., 10 (optional)" value={v.est_daily_bags} onChange={(e) => set("est_daily_bags", e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Phone size={16} /> Contact number <span className="muted font-normal">(phone or email required)</span>
                </label>
                <input className="input" placeholder="09xx xxx xxxx" value={v.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Mail size={16} /> Email
                </label>
                <input className="input" placeholder="owner@store.com" value={v.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
                {!isEmail(v.contact_email) ? (
                  <div className="text-xs" style={{ color: "hsl(var(--accent))" }}>
                    Please enter a valid email or leave it blank.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Pickup notes / hours</label>
              <textarea
                className="input"
                rows={4}
                placeholder="e.g., Pickup 7–9pm. Ask for cashier. Weekends 4–6pm."
                value={v.pickup_notes}
                onChange={(e) => set("pickup_notes", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-2">
              <div className="text-xs muted">
                By submitting, you agree to be contacted for onboarding.
              </div>

              <motion.button
                whileTap={{ scale: 0.985 }}
                className="btn btn-primary shine"
                onClick={submit}
                disabled={!canSubmit || loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    Submit application <Sparkles size={16} />
                  </>
                )}
              </motion.button>
            </div>

            <AnimatePresence>
              {err ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="text-sm mt-2"
                  style={{ color: "hsl(var(--accent))" }}
                >
                  {err}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right: Trust panel */}
      <div className="lg:col-span-2 space-y-4">
        <div className="card-soft p-6">
          <div className="text-sm font-extrabold">What happens next</div>
          <div className="mt-3 grid gap-3 text-sm">
            <div className="flex gap-3">
              <span className="chip">1</span>
              <div>
                <div className="font-semibold">We contact you</div>
                <div className="muted">Confirm pickup window & bundle type.</div>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="chip">2</span>
              <div>
                <div className="font-semibold">You get a dashboard</div>
                <div className="muted">Post deals and view reserve codes.</div>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="chip">3</span>
              <div>
                <div className="font-semibold">Start selling surplus</div>
                <div className="muted">Reduce waste and bring in new customers.</div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {ok ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="card p-6"
              style={{
                borderColor: "hsl(var(--primary) / 0.30)",
                background: "hsl(var(--primary) / 0.06)",
              }}
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} style={{ color: "hsl(var(--primary))" }} />
                <div>
                  <div className="text-sm font-extrabold">Application received!</div>
                  <div className="text-sm muted mt-1">
                    We’ll reach out soon to activate your store dashboard.
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="card p-6">
          <div className="text-sm font-extrabold">Support</div>
          <div className="mt-2 text-sm muted">
            Prefer to message instead? You can DM us and we’ll onboard you manually.
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="chip">WhatsApp</span>
            <span className="chip">Viber</span>
            <span className="chip">Instagram</span>
          </div>
        </div>
      </div>
    </div>
  );
}