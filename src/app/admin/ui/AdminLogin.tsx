"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function signIn() {
    setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
    else window.location.href = "/admin/dashboard";
}

  async function signOut() {
    await supabase.auth.signOut();
    setMsg("Signed out.");
  }

  return (
    <div className="grid gap-3">
      <input
        className="rounded-xl border px-3 py-2"
        placeholder="Admin email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="rounded-xl border px-3 py-2"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div className="flex gap-2">
        <button onClick={signIn} className="rounded-xl bg-black text-white px-4 py-2 text-sm">
          Sign in
        </button>
        <button onClick={signOut} className="rounded-xl border px-4 py-2 text-sm">
          Sign out
        </button>
      </div>
      {msg ? <div className="text-xs text-gray-600">{msg}</div> : null}
    </div>
  );
}