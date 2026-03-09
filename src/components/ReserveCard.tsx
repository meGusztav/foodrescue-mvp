"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Ticket, Mail, Minus, Plus, Sparkles } from "lucide-react";

type Props = {
  dealId: string;
  remaining: number;
};

export default function ReserveCard({ dealId, remaining }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const maxQty = useMemo(() => Math.max(1, Math.min(10, remaining)), [remaining]);
  const canReserve = remaining > 0 && !loading;

  function dec() {
    setQty((q) => Math.max(1, q - 1));
  }
  function inc() {
    setQty((q) => Math.min(maxQty, q + 1));
  }

  async function reserve() {
    setErr(null);
    if (!dealId) return setErr("Invalid deal id.");
    if (remaining <= 0) return setErr("Sold out.");

    setLoading(true);
    try {
      // Call the same RPC you already created (atomic)
      const { data, error } = await supabase.rpc("reserve_deal", {
        p_deal_id: dealId,
        p_qty: qty,
        p_user_email: email.trim() || null,
      });

      if (error) throw new Error(error.message);

      const code = data?.[0]?.code;
      if (!code) throw new Error("Reservation failed. Please try again.");

      router.push(`/deals/${dealId}?code=${encodeURIComponent(code)}`);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6 md:p-7 sticky top-24">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-extrabold tracking-tight">Reserve</div>
        <span className="chip">
          <Ticket size={14} />
          {remaining > 0 ? `${remaining} left` : "Sold out"}
        </span>
      </div>

      <div className="mt-3 text-sm muted">
        Get a code instantly. Show it at pickup.
      </div>

      <div className="mt-5 grid gap-3">
        <label className="text-sm font-semibold">Email (optional)</label>
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            className="input pl-11"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <label className="text-sm font-semibold mt-2">Quantity</label>
        <div className="flex items-center justify-between gap-3">
          <button
            className="btn btn-ghost h-11 w-11 p-0"
            onClick={dec}
            disabled={!canReserve || qty <= 1}
            aria-label="Decrease quantity"
          >
            <Minus size={16} />
          </button>

          <div className="flex-1 card-soft py-3 text-center">
            <div className="text-xs muted">Qty</div>
            <div className="text-lg font-extrabold">{qty}</div>
          </div>

          <button
            className="btn btn-ghost h-11 w-11 p-0"
            onClick={inc}
            disabled={!canReserve || qty >= maxQty}
            aria-label="Increase quantity"
          >
            <Plus size={16} />
          </button>
        </div>

        <motion.button
          whileTap={{ scale: 0.985 }}
          className="btn btn-primary mt-2 w-full shine"
          onClick={reserve}
          disabled={!canReserve}
        >
          {loading ? "Reserving…" : remaining > 0 ? "Reserve now" : "Sold out"}
          <Sparkles size={16} />
        </motion.button>

        <AnimatePresence>
          {err ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="text-sm mt-2"
              style={{ color: "hsl(var(--accent))" }}
            >
              {err}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="mt-3 text-xs muted">
          No payment yet — reserve code only (MVP).
        </div>
      </div>
    </div>
  );
}