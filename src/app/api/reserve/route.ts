import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const url = new URL(req.url);
  const dealId = url.searchParams.get("dealId");
  if (!dealId) return NextResponse.json({ error: "Missing dealId" }, { status: 400 });

  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim() || null;
  const qtyRaw = Number(form.get("qty") ?? 1);
  const qty = Number.isFinite(qtyRaw) ? Math.max(1, Math.floor(qtyRaw)) : 1;

  const { data, error } = await supabase.rpc("reserve_deal", {
    p_deal_id: dealId,
    p_qty: qty,
    p_user_email: email,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const code = data?.[0]?.code;
  if (!code) return NextResponse.json({ error: "Reservation failed" }, { status: 500 });

  return NextResponse.redirect(new URL(`/deals/${dealId}?code=${code}`, url.origin), { status: 303 });
}