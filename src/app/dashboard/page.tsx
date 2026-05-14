import DashboardView from "@/components/dashboard/dashboard-view";

async function getContracts() {
  const res = await fetch("http://localhost:3000/api/contracts", {
    cache: "no-store",
  });

  const data = await res.json();

  return data.contracts || [];
}

export default async function DashboardPage() {
  const contracts = await getContracts();

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-[1800px]">
        <DashboardView initialContracts={contracts} />
      </div>
    </main>
  );
}
