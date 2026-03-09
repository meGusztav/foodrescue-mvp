import StoreApplyForm from "./ui/StoreApplyForm";

export default function StoreApplyPage() {
  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <div className="chip inline-flex mb-3" style={{ borderColor: "hsl(var(--primary) / 0.25)", background: "hsl(var(--primary) / 0.08)" }}>
          🍽️ For restaurants & shops
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Get listed on SecondServe</h1>
        <p className="mt-3 muted text-base">
          Turn surplus food into discounted bundles. We’ll help you post deals, manage reservations, and reduce waste.
        </p>
      </div>

      <StoreApplyForm />
    </div>
  );
}