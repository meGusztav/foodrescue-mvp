import Link from "next/link";
import CustomerAuthCard from "@/components/CustomerAuthCard";

type PageProps = {
  searchParams?: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const nextPath = sp?.next ?? "/orders";

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-5">
          <div className="chip">Customer access</div>

          <h1 className="text-4xl font-extrabold tracking-tight">
            Sign in to reserve a deal
          </h1>

          <p className="muted text-base">
            Browse deals, reserve surprise bags, and keep all your pickup codes in one place.
          </p>

          <div className="card p-6 md:p-7">
            <div className="text-lg font-extrabold">New to SecondServe?</div>
            <div className="mt-2 text-sm muted">
              Create a customer account so you can reserve deals and view your orders anytime.
            </div>

            <div className="mt-5">
              <Link
                href={`/register?next=${encodeURIComponent(nextPath)}`}
                className="btn btn-primary"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>

        <CustomerAuthCard mode="login" nextPath={nextPath} />
      </div>
    </div>
  );
}