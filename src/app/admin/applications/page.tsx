import AdminApplications from "./ui/AdminApplications";

export default function AdminApplicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="chip inline-flex mb-3">🧾 Admin</div>
        <h1 className="text-3xl font-extrabold tracking-tight">Store applications</h1>
        <p className="mt-2 muted">
          Review inbound stores, update statuses, and convert applications into real stores.
        </p>
      </div>

      <AdminApplications />
    </div>
  );
}