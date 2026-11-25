import AppShell from "@/components/AppShell";
import BuddiesView from "@/components/BuddiesView";
import WitnessRequestsCard from "@/components/WitnessRequestsCard";

export default function BuddiesPage() {
  return (
    <AppShell title="Battle buddies">
      <div className="space-y-10">
        <div>
          <h2 className="display text-[1.75rem] text-ink sm:text-[2rem]">The people who were there.</h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
            Find the veterans who served where you did and confirm each other&apos;s exposures, privately. Or send
            a private link to someone who is not on this app and ask them to confirm your record.
          </p>
        </div>
        <BuddiesView />
        <section className="space-y-4 border-t border-line pt-8">
          <h2 className="text-xl font-semibold tracking-tight text-ink">Not on this app? Ask them directly</h2>
          <WitnessRequestsCard />
        </section>
      </div>
    </AppShell>
  );
}
