import AdminDeals from "./ui/AdminDeals";

export default function AdminDealsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Deals</h1>
        <p className="muted mt-1">Manage deals across all stores.</p>
      </div>

      <AdminDeals />
    </div>
  );
}