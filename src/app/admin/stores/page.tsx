import AdminStores from "./ui/AdminStores";

export default function AdminStoresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Stores</h1>
        <p className="muted mt-1">View stores, copy IDs, and see linked store accounts.</p>
      </div>

      <AdminStores />
    </div>
  );
}