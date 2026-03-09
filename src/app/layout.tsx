import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SecondServe",
  description: "Near-expiry deals in your area. First dibs, on the second serve",
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-2xl px-3 py-2 text-sm font-semibold text-[hsl(var(--muted))] hover:text-[hsl(var(--text))] hover:bg-black/5 transition"
    >
      {children}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="sticky top-0 z-50 backdrop-blur bg-[hsl(var(--bg))]/80 border-b" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="container-app py-4 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div
                className="h-11 w-11 rounded-2xl grid place-items-center text-lg border bg-white shadow-sm"
                style={{ borderColor: "hsl(var(--border))" }}
                aria-hidden
              >
                🍃
              </div>
              <div className="leading-tight">
                <div className="font-extrabold tracking-tight text-base">SecondServe</div>
                <div className="text-xs muted">First dibs, on the second serve</div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <NavLink href="/deals">Deals</NavLink>
              <NavLink href="/stores/apply">For stores</NavLink>
              <NavLink href="/store">Store dashboard</NavLink>
              <NavLink href="/admin">Admin</NavLink>
            </nav>

            <div className="md:hidden">
              <Link className="btn btn-ghost" href="/deals">Browse</Link>
            </div>
          </div>
        </header>

        <main className="container-app py-10">{children}</main>

        <footer className="mt-14">
          <div className="divider" />
          <div className="container-app py-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm muted">© {new Date().getFullYear()} SecondServe</div>
            <div className="flex flex-wrap gap-2">
              <span className="chip">MVP</span>
              <span className="chip">Reserve codes</span>
              <span className="chip">PH launch</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}