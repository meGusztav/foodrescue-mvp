import CustomerAuthCard from "@/components/CustomerAuthCard";

type PageProps = {
  searchParams?: Promise<{ next?: string }>;
};

export default async function RegisterPage({ searchParams }: PageProps) {
  const sp = searchParams ? await searchParams : undefined;
  const nextPath = sp?.next ?? "/orders";

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          <div className="chip">Customer signup</div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            Create your SecondServe account
          </h1>
          <p className="muted text-base">
            Make reservations, view your active pickup codes, and keep your orders in one place.
          </p>
        </div>

        <CustomerAuthCard mode="register" nextPath={nextPath} />
      </div>
    </div>
  );
}