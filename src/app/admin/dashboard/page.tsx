import Link from "next/link";
import AdminDashboard from "../ui/AdminDashboard";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-gray-600">Create stores and deals (MVP).</p>
        </div>
        <Link href="/admin" className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50">
          Back to Admin Login
        </Link>
      </div>

      <AdminDashboard />
    </div>
  );
}