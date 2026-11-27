"use client";

// No React state, no router link, and no Supabase client: this component
// renders the same static education for every visitor and touches nothing
// personal.
import {
  SOLUTION_PILLARS, START_THIS_WEEK, VA_WHOLE_HEALTH_NOTE, SOLUTION_CATEGORY_ORDER,
  RESOURCE_POINTERS, type SolutionPillar,
} from "@/lib/education";

// 🔴 This page is deliberately NOT personalised. It used to rank pillars against
// the veteran's own logged exposures and conditions under a heading reading
// "Tailored to your record", which meant a man who logged heavy metals was shown
// "Support natural detox" as advice matched to him. This app sells nothing and
// recommends no product, but no transaction is needed anywhere for that click
// path to read as a funnel to an outside reviewer.
// Everyone now sees the same pillars in the same order. Do not reintroduce
// matching here. SolutionPillar no longer carries the fields to do it with.
function PillarCard({ p }: { p: SolutionPillar }) {
  return (
    <article className="card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-canvas text-brand">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
            <path d={p.icon} />
          </svg>
        </span>
        <h3 className="text-lg font-semibold tracking-tight text-ink">{p.title}</h3>
      </div>

      <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{p.why}</p>

      <div className="mt-4">
        <div className="text-[0.9375rem] font-semibold text-ink">Everyday, low-risk steps</div>
        <ul className="mt-2 space-y-1.5">
          {p.everyday.map((e, i) => (
            <li key={i} className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-ink">
              <span className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-accent" aria-hidden="true" />
              <span>{e}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-xl bg-canvas p-4">
        <div className="text-[0.9375rem] font-semibold text-ink">Bring to your practitioner</div>
        <ul className="mt-2 space-y-1.5">
          {p.practitioner.map((q, i) => (
            <li key={i} className="flex gap-2.5 text-[0.9375rem] leading-relaxed text-ink">
              <span className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-brand" aria-hidden="true" />
              <span>{q}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function SolutionsView() {
  // No auth check, and no data fetch of any kind. Opened to the public
  // 2026-08-16 along with the rest of the education routes. The rule that
  // keeps it safe to be public: nothing on this page is matched to a
  // personal record. See the note above PillarCard.
  const categories = SOLUTION_CATEGORY_ORDER.filter((cat) => SOLUTION_PILLARS.some((p) => p.category === cat));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="display text-[1.75rem] text-ink sm:text-[2rem]">Burden, not broken.</h2>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          Most veterans aren&apos;t broken. They are carrying a burden that was never measured or written down.
          Nothing on this page undoes an exposure, and nobody here is selling you anything that claims to. What
          follows is the ordinary, unglamorous ground floor: sleep, movement, blood pressure, blood sugar, smoking.
          It is not exciting, and it is the part that is still movable.
        </p>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
          This is general education for every veteran. None of it is matched to your record, and none of it is
          personal advice. It is not treatment, not a prescription, and never part of your VA claim.{" "}
          <span className="font-semibold text-ink">This app is free and sells nothing.</span>
        </p>
        <nav aria-label="On this page" className="mt-4 flex flex-wrap gap-2">
          <a href="#this-week" className="btn btn-secondary btn-sm min-h-11">Start this week</a>
          {categories.map((cat) => (
            <a key={cat} href={`#${slug(cat)}`} className="btn btn-secondary btn-sm min-h-11">{cat}</a>
          ))}
          <a href="#choosing-help" className="btn btn-secondary btn-sm min-h-11">Choosing help</a>
        </nav>
      </div>

      {/* Start this week: the free medicine */}
      <section id="this-week" className="card scroll-mt-20 p-5 sm:p-6">
        <h3 className="text-lg font-semibold tracking-tight text-ink">Start this week: the free medicine</h3>
        <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">
          You don&apos;t have to wait for an appointment. Pick one, do it for two weeks, then add the next.
        </p>
        <ol className="mt-4 space-y-2.5">
          {START_THIS_WEEK.map((s, i) => (
            <li key={i} className="flex gap-3 text-[0.9375rem] leading-relaxed text-ink">
              <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand text-[0.8125rem] font-semibold text-white">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-xl bg-canvas px-4 py-3 text-[0.9375rem] leading-relaxed text-muted">
          Sequence it safely: stabilize before you optimize, change one thing at a time so you can tell
          what&apos;s working, and never stop a prescribed medication on your own. Any taper happens with
          your prescriber.
        </p>
      </section>

      {/* VA runs its own real clinical "Whole Health" program. Say so once, plainly. */}
      <p className="rounded-xl border border-line bg-canvas px-4 py-3 text-[0.9375rem] leading-relaxed text-muted">
        {VA_WHOLE_HEALTH_NOTE}
      </p>

      {/* Cascade order: know what you're carrying, THEN reduce the burden, THEN
          the daily-habit work, THEN a guard against exploitation, THEN extend
          the circle. Same order, same content, for every visitor. Grouping is
          display-only and never computed from a veteran's record. */}
      {categories.map((cat) => {
        const pillars = SOLUTION_PILLARS.filter((p) => p.category === cat);
        const resources = RESOURCE_POINTERS.filter((r) => r.category === cat);
        return (
          <section key={cat} id={slug(cat)} className="scroll-mt-20 space-y-4">
            <h3 className="text-lg font-semibold tracking-tight text-ink">{cat}</h3>
            {pillars.map((p) => <PillarCard key={p.key} p={p} />)}
            {resources.length > 0 && (
              <div className="card p-5">
                <h4 className="text-[0.9375rem] font-semibold text-ink">Real, free help</h4>
                <ul className="mt-3 space-y-3">
                  {resources.map((r) => (
                    <li key={r.name} className="text-[0.9375rem] leading-relaxed">
                      <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-brand hover:underline">{r.name}</a>
                      {r.partner && <span className="ml-2 rounded-full bg-canvas px-2 py-0.5 text-[0.8125rem] font-medium text-muted">Partner nonprofit, not VA</span>}
                      <div className="text-muted">{r.what}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })}

      <section id="choosing-help" className="card scroll-mt-20 border-brand/30 bg-brand/5 p-5 sm:p-6">
        <h3 className="text-lg font-semibold tracking-tight text-ink">Choosing help wisely</h3>
        <ul className="mt-3 space-y-2 text-[0.9375rem] leading-relaxed text-ink">
          <li className="flex gap-2.5"><span className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-brand" aria-hidden="true" /><span>Run from anyone who promises a cure. No honest person will.</span></li>
          <li className="flex gap-2.5"><span className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-brand" aria-hidden="true" /><span>Be cautious of anyone whose entire answer is the products they happen to sell.</span></li>
          <li className="flex gap-2.5"><span className="mt-[9px] h-1.5 w-1.5 flex-none rounded-full bg-brand" aria-hidden="true" /><span>Good help welcomes the questions: &ldquo;Will you test before you treat? Will you coordinate with my VA doctors?&rdquo;</span></li>
        </ul>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink">
          Supplements, herbs, and protocols can interact with medications and conditions, including
          stressing the kidneys or liver, the very organs many exposures already burden. Always talk with
          a qualified clinician before starting anything. If you&apos;re struggling, the Veterans Crisis
          Line is here 24/7: dial <strong>988</strong>, then press <strong>1</strong>.
        </p>
      </section>
    </div>
  );
}
