import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import AuthNav from "@/components/AuthNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SecondServe",
  description: "First dibs, on the second serve",
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[13px] font-semibold text-[#74877D] transition hover:text-[#1E3D2D]"
    >
      {children}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#F7F5EF] text-[#12212B]`}>
        <header className="sticky top-0 z-50 border-b border-black/5 bg-[#F7F5EF]/95 backdrop-blur">
          <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-8 xl:px-12">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-transparent text-[20px]">
                🍃
              </div>
              <div className="text-[13px] font-extrabold tracking-tight text-[#1E3D2D]">
                SecondServe
              </div>
            </Link>

            <nav className="hidden items-center gap-8 md:flex">
              <NavLink href="/deals">Discover</NavLink>
              <NavLink href="/#how-it-works">How It Works</NavLink>
              <NavLink href="/stores/apply">For Business</NavLink>
              <NavLink href="/store">Store Login</NavLink>
            </nav>

            <div className="flex items-center gap-3">
              <AuthNav />
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-68px)]">
          <div className="mx-auto max-w-[1180px] px-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}