"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, ShoppingBag, User } from "lucide-react";
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
    return <div className="text-sm text-[#74877D]">...</div>;
  }

  if (!userEmail) {
    return (
      <div className="flex items-center gap-4">
        <span className="hidden items-center text-[#74877D] md:inline-flex">
          <MapPin size={15} />
        </span>
        <span className="hidden items-center text-[#74877D] md:inline-flex">
          <ShoppingBag size={15} />
        </span>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2F6F4E] px-4 py-2 text-[13px] font-bold text-white transition hover:bg-[#285E43]"
        >
          <User size={14} />
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/orders"
        className="inline-flex rounded-xl border border-black/10 bg-white px-4 py-2 text-[13px] font-bold text-[#12212B]"
      >
        Orders
      </Link>

      <button
        type="button"
        onClick={signOut}
        className="inline-flex rounded-xl border border-black/10 bg-white px-4 py-2 text-[13px] font-bold text-[#12212B]"
      >
        Logout
      </button>
    </div>
  );
}