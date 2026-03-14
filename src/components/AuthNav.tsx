"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthNav() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserEmail(data.user?.email ?? null);
      setLoading(false);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  if (loading) {
    return <div className="text-sm muted">...</div>;
  }

  if (!userEmail) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="btn btn-ghost">
          Login
        </Link>
        <Link href="/register" className="btn btn-primary">
          Register
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/orders" className="btn btn-ghost">
        Orders
      </Link>
      <button className="btn btn-ghost" onClick={signOut} type="button">
        Logout
      </button>
    </div>
  );
}