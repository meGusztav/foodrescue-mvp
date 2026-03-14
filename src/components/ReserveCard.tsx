"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Ticket, Minus, Plus, Sparkles, Lock } from "lucide-react";

type Props = {
  dealId: string;
  remaining: number;
};

export default function ReserveCard({ dealId, remaining }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);

  const maxQty = useMemo(() => Math.max(1, Math.min(10, remaining)), [remaining]);
  const canReserve = remaining > 0 && !loading;

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setIsSignedIn(Boolean(data.user));
    }

    loadUser();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  function dec() {
    setQty((q) => Math.max(1, q - 1));
  }

  function inc() {
    setQty((q) => Math.min(maxQty, q + 1));
  }

  async function reserve() {
    setErr(null);

    if (!dealId) {
      setErr("Invalid deal id.");
      return;
    }

    if (remaining <= 0) {
      setErr("Sold out.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/deals/${dealId}`)}`);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.rpc("reserve_deal_authenticated", {
        p_deal_id: dealId,
        p_qty: qty,
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
        {isSignedIn
          ? "Reserve now and your pickup code will appear instantly."
          : "You need a customer account to reserve this deal."}
      </div>

      <div className="mt-5 grid gap-3">
        <label className="text-sm font-semibold">Quantity</label>
        <div className="flex items-center justify-between gap-3">
          <button
            className="btn btn-ghost h-11 w-11 p-0"
            onClick={dec}
            disabled={!canReserve || qty <= 1}
            aria-label="Decrease quantity"
            type="button"
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
            type="button"
          >
            <Plus size={16} />
          </button>
        </div>

        <motion.button
          whileTap={{ scale: 0.985 }}
          className="btn btn-primary mt-2 w-full shine"
          onClick={reserve}
          disabled={!canReserve}
          type="button"
        >
          {loading ? (
            "Reserving…"
          ) : isSignedIn ? (
            "Reserve now"
          ) : (
            <>
              Sign in to reserve <Lock size={16} />
            </>
          )}
          {isSignedIn ? <Sparkles size={16} /> : null}
        </motion.button>

        {!isSignedIn ? (
          <button
            type="button"
            className="btn btn-ghost w-full"
            onClick={() => router.push(`/register?next=${encodeURIComponent(`/deals/${dealId}`)}`)}
          >
            Create account
          </button>
        ) : null}

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
          No payment yet — reservation code only for now.
        </div>
      </div>
    </div>
  );
}