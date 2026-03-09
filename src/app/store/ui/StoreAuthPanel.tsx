"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Mail, Lock, Sparkles, ArrowRight } from "lucide-react";

function hardReloadToStore() {
  // add a query so it’s definitely treated as a navigation
  window.location.assign("/store?fresh=1");
}

function cleanEmail(raw: string) {
  return raw
    .trim()
    .replace(/\s+/g, "")  // removes any spaces inside
    .toLowerCase();
}

export default function StoreAuthPanel({ onAuthed }: { onAuthed?: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup" | "magic">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setMsg(null);
  }, [mode]);

  async function signIn() {
    setMsg(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail(email),
        password,
      });
      if (error) throw new Error(error.message);
      hardReloadToStore();
    } catch (e: any) {
      setMsg(e?.message ?? "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function signUp() {
    setMsg(null);
    setLoading(true);
    try {
      const e = cleanEmail(email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
        setMsg("Please enter a valid email address.");
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: e,
        password,
      });

      if (error) throw new Error(error.message);

      setMsg("Account created! Next step: we’ll link this email to your store and activate your dashboard.");
      setMode("signin");
    } catch (e: any) {
      setMsg(e?.message ?? "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  async function sendMagicLink() {
    setMsg(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail(email),
        options: {
          // IMPORTANT: change this to your deployed URL later
          emailRedirectTo: `${window.location.origin}/store`,
        },
      });
      if (error) throw new Error(error.message);
      setMsg("Magic link sent! Check your email.");
    } catch (e: any) {
      setMsg(e?.message ?? "Could not send magic link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-extrabold tracking-tight">Store sign in</div>
          <div className="text-sm muted mt-1">
            Stores post deals here. If you’re a customer, browse <a className="link" href="/deals">Deals</a>.
          </div>
        </div>
        <span className="chip">
          <Sparkles size={14} /> Store portal
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          className={`btn ${mode === "signin" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setMode("signin")}
          type="button"
        >
          Sign in
        </button>
        <button
          className={`btn ${mode === "signup" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setMode("signup")}
          type="button"
        >
          Create account
        </button>
        <button
          className={`btn ${mode === "magic" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setMode("magic")}
          type="button"
        >
          Magic link
        </button>
      </div>

      <div className="mt-5 grid gap-3 max-w-md">
        <label className="text-sm font-semibold">Email</label>
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            className="input pl-11"
            placeholder="owner@restaurant.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        {mode !== "magic" ? (
          <>
            <label className="text-sm font-semibold mt-2">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                className="input pl-11"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
            </div>
            <div className="text-xs muted">
              Tip: For MVP, you can also use Magic Link so owners don’t forget passwords.
            </div>
          </>
        ) : (
          <div className="text-xs muted mt-2">
            We’ll email a sign-in link. Great for store owners.
          </div>
        )}

        <div className="mt-3">
          {mode === "signin" ? (
            <button className="btn btn-primary shine w-full" disabled={loading} onClick={signIn}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Signing in…</> : <>Sign in <ArrowRight size={16} /></>}
            </button>
          ) : mode === "signup" ? (
            <button className="btn btn-primary shine w-full" disabled={loading} onClick={signUp}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Creating…</> : <>Create account <ArrowRight size={16} /></>}
            </button>
          ) : (
            <button className="btn btn-primary shine w-full" disabled={loading} onClick={sendMagicLink}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <>Send magic link <ArrowRight size={16} /></>}
            </button>
          )}
        </div>

        <AnimatePresence>
          {msg ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="text-sm mt-2"
            >
              {msg}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}