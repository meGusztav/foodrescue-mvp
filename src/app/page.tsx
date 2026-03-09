import HeroWow from "@/components/HeroWow";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <HeroWow />

      <section className="grid gap-6 md:grid-cols-3">
        {[
          { title: "Better value", desc: "High-quality bundles at a fraction of the price." },
          { title: "Less waste", desc: "Surplus food gets a second chance instead of the bin." },
          { title: "Fast pickup", desc: "Reserve in seconds. Show code. Grab and go." },
        ].map((x) => (
          <div key={x.title} className="card p-6 hover:shadow-md transition-shadow">
            <div className="text-lg font-extrabold tracking-tight">{x.title}</div>
            <p className="mt-2 muted text-sm">{x.desc}</p>
          </div>
        ))}
      </section>

      <section className="card p-6 md:p-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-lg font-extrabold">Own a restaurant or shop?</div>
          <div className="text-sm muted mt-1">Post surplus bundles and reach new customers.</div>
        </div>
        <Link className="btn btn-primary" href="/stores/apply">
          Get listed
        </Link>
      </section>
    </div>
  );
}