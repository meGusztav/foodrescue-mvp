import AdminLogin from "./ui/AdminLogin";

export default function AdminPage() {
  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="text-gray-600 text-sm">
        Login to manage stores and deals. (MVP)
      </p>
      <div className="rounded-2xl border p-6">
        <AdminLogin />
      </div>
    </div>
  );
}