"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Mail, Lock, Sparkles, ArrowRight } from "lucide-react";

function hardReloadToStore() {
  window.location.assign("/store?fresh=1");
}

function cleanEmail(raw: string) {
  return raw.trim().replace(/\s+/g, "").toLowerCase();
}

async function tryClaimStoreLink() {
  const { data, error } = await supabase.rpc("claim_my_store_link");
  if (error) throw error;
  return data as { linked: boolean; store_id: string | null } | null;
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

  async function finishAfterAuth() {
    try {
      const result = await tryClaimStoreLink();
      onAuthed?.();

      if (result?.linked) {
        setMsg("Your account is now linked to your store. Redirecting…");
      } else {
        setMsg("Signed in, but no approved store link was found for this email yet.");
      }
    } catch (e: any) {
      setMsg(`Signed in, but auto-link failed: ${e?.message ?? "Unknown error"}`);
    }

    hardReloadToStore();
  }

  async function signIn() {
    setMsg(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail(email),
        password,
      });
      if (error) throw new Error(error.message);
      await finishAfterAuth();
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

      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        await finishAfterAuth();
        return;
      }

      setMsg("Account created. After email confirmation, sign in here and we’ll try to auto-link your store.");
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
      const e = cleanEmail(email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
        setMsg("Please enter a valid email address.");
        return;
      }

      const redirectTo = `${window.location.origin}/store`;
      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: { emailRedirectTo: redirectTo },
      });
      if (error) throw new Error(error.message);

      setMsg("Magic link sent. After you open it, we’ll try to auto-link your store on the dashboard.");
    } catch (e: any) {
      setMsg(e?.message ?? "Could not send magic link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card relative overflow-hidden p-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,179,71,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(46,125,50,0.10),transparent_30%)]" />

      <div className="relative grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
        <div
          className="hidden md:flex flex-col justify-between border-r p-8"
          style={{ borderColor: "hsl(var(--border))" }}
        >
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
              style={{ borderColor: "hsl(var(--border))" }}
            >
              <Sparkles size={14} /> SecondServe for Stores
            </div>

            <h2 className="mt-6 text-3xl font-extrabold tracking-tight leading-tight">
              Manage your deals, pickup flow, and store dashboard.
            </h2>
            <p className="mt-3 text-sm muted max-w-sm">
              Sign in with the same email used on your approved store application. We’ll try to link
              your account automatically.
            </p>
          </div>

          <div className="grid gap-3 text-sm mt-10">
            <div className="card-soft p-4">Create and edit live deals from your storefront dashboard.</div>
            <div className="card-soft p-4">Track reservations and mark orders as picked up.</div>
            <div className="card-soft p-4">Auto-link works when your application email matches your login email.</div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="mx-auto max-w-md">
            <div className="md:hidden mb-6">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
                style={{ borderColor: "hsl(var(--border))" }}
              >
                <Sparkles size={14} /> SecondServe for Stores
              </div>
            </div>

            <div className="flex rounded-2xl border p-1" style={{ borderColor: "hsl(var(--border))" }}>
              {[
                ["signin", "Sign in"],
                ["signup", "Create account"],
                ["magic", "Magic link"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value as "signin" | "signup" | "magic")}
                  className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    mode === value ? "bg-black text-white" : "hover:bg-black/5"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                  <input
                    className="input pl-10"
                    type="email"
                    placeholder="owner@shop.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              {mode !== "magic" ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
                    <input
                      className="input pl-10"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    />
                  </div>
                </div>
              ) : null}

              {mode === "signin" ? (
                <button className="btn btn-primary w-full" onClick={signIn} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Signing in…
                    </>
                  ) : (
                    <>
                      <ArrowRight size={16} /> Sign in
                    </>
                  )}
                </button>
              ) : null}

              {mode === "signup" ? (
                <button className="btn btn-primary w-full" onClick={signUp} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Creating account…
                    </>
                  ) : (
                    <>
                      <ArrowRight size={16} /> Create account
                    </>
                  )}
                </button>
              ) : null}

              {mode === "magic" ? (
                <button className="btn btn-primary w-full" onClick={sendMagicLink} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Sending link…
                    </>
                  ) : (
                    <>
                      <ArrowRight size={16} /> Send magic link
                    </>
                  )}
                </button>
              ) : null}
            </div>

            <AnimatePresence>
              {msg ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="card-soft mt-4 p-4 text-sm"
                >
                  {msg}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}