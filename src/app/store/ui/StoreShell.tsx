"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import StoreAuthPanel from "./StoreAuthPanel";
import StoreDashboard from "./StoreDashboard";

export default function StoreShell() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;

    // Initial check (async inside effect is fine)
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setAuthed(!!data.session?.user);
    })();

    // Subscribe to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      // This is the correct place to set state
      setAuthed(!!session?.user);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Loading state
  if (authed === null) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Store Dashboard</h1>
        <p className="muted mt-2">Create deals and view reservations for your store.</p>
      </div>

      {!authed ? (
        <StoreAuthPanel onAuthed={() => setAuthed(true)} />
      ) : (
        <StoreDashboard onSignedOut={() => setAuthed(false)} />
      )}
    </div>
  );
}