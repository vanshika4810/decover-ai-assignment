import UploadSection from "@/components/upload/upload-section";
import ContractsSection from "@/components/contracts/contracts-section";

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
      <div className="mx-auto max-w-[1800px] space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Contract Review Dashboard</h1>

          <p className="mt-2 text-muted-foreground">
            Upload contracts and analyze legal clauses.
          </p>
        </div>

        <UploadSection />

        <ContractsSection contracts={contracts} />
      </div>
    </main>
  );
}
