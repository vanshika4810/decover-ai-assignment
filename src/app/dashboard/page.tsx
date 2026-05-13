import UploadSection from "@/components/upload/upload-section";

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-bold">Contract Review Dashboard</h1>

        <p className="mt-2 text-muted-foreground">
          Upload contracts and analyze clauses.
        </p>

        <div className="mt-8">
          <UploadSection />
        </div>
      </div>
    </main>
  );
}
