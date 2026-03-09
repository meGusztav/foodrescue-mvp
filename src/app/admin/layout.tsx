import Link from "next/link";

function AdminTab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl px-4 py-2 text-sm font-extrabold text-[hsl(var(--muted))] hover:text-[hsl(var(--text))] hover:bg-black/5 transition"
    >
      {label}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="card p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="chip inline-flex">🔐 Admin</div>
            <div className="mt-2 text-xl font-extrabold tracking-tight">Dashboard</div>
            <div className="text-sm muted mt-1">
              Manage stores, applications, and operations.
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            <AdminTab href="/admin" label="Overview" />
            <AdminTab href="/admin/applications" label="Applications" />
            {/* Future tabs */}
            <AdminTab href="/admin/stores" label="Stores" />
            <AdminTab href="/admin/deals" label="Deals" />
          </nav>
        </div>
      </div>

      {children}
    </div>
  );
}