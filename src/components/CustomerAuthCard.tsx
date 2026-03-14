"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  mode: "login" | "register";
  nextPath?: string;
};

function cleanEmail(raw: string) {
  return raw.trim().replace(/\s+/g, "").toLowerCase();
}

function sanitizeNextPath(raw?: string | null) {
  if (!raw || !raw.startsWith("/")) return "/orders";
  return raw;
}

export default function CustomerAuthCard({ mode, nextPath }: Props) {
  const router = useRouter();
  const safeNextPath = sanitizeNextPath(nextPath);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function signIn() {
    setMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail(email),
        password,
      });

      if (error) throw new Error(error.message);

      router.push(safeNextPath);
      router.refresh();
    } catch (e: any) {
      setMsg(e?.message ?? "Sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function signUp() {
    setMsg(null);

    const normalizedEmail = cleanEmail(email);

    if (!normalizedEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setMsg("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setMsg("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) throw new Error(error.message);

      if (data.session) {
        router.push(safeNextPath);
        router.refresh();
        return;
      }

      setMsg("Account created. Check your email if confirmation is enabled, then sign in.");
    } catch (e: any) {
      setMsg(e?.message ?? "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="card p-6 md:p-7 max-w-md">
      <div>
        <div className="text-sm font-extrabold tracking-tight">
          {isLogin ? "Customer login" : "Create your customer account"}
        </div>
        <div className="text-sm muted mt-1">
          Sign in to reserve deals and view your orders.
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <label className="text-sm font-semibold">Email</label>
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            className="input pl-11"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <label className="text-sm font-semibold mt-2">Password</label>
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
          <input
            className="input pl-11"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </div>

        {!isLogin ? (
          <>
            <label className="text-sm font-semibold mt-2">Confirm password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                className="input pl-11"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </>
        ) : null}

        <div className="mt-3">
          {isLogin ? (
            <button className="btn btn-primary shine w-full" disabled={loading} onClick={signIn}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )}
            </button>
          ) : (
            <button className="btn btn-primary shine w-full" disabled={loading} onClick={signUp}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creating account…
                </>
              ) : (
                <>
                  Create account <ArrowRight size={16} />
                </>
              )}
            </button>
          )}
        </div>

        <div className="text-sm muted">
          {isLogin ? (
            <>
              New here?{" "}
              <Link className="link" href={`/register?next=${encodeURIComponent(safeNextPath)}`}>
                Create an account
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link className="link" href={`/login?next=${encodeURIComponent(safeNextPath)}`}>
                Sign in
              </Link>
            </>
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