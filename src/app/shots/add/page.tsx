import AppShell from "@/components/AppShell";
import ShotCaptureFlow from "@/components/ShotCaptureFlow";

export default async function AddShotPage({ searchParams }: { searchParams: Promise<{ shot?: string }> }) {
  const { shot } = await searchParams;
  return (
    <AppShell title="Add a shot">
      <ShotCaptureFlow initialSlug={shot} />
    </AppShell>
  );
}
