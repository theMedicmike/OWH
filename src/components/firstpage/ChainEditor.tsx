"use client";

import { useCallback, useEffect, useState } from "react";
import { SavedMark, useAutosave, useUndo } from "../Keep";
import { useAuth } from "../AuthProvider";
import { deleteSimple, insertSimple, listSimple, updateSimple, type FpChainLink } from "@/lib/firstPage";
import { EXPOSURE_LABEL, INCIDENT_LABEL } from "@/lib/education";
import { BackToHub, CardTitle, Input, Notice, PrimaryButton, QuickPicks } from "./Controls";

// The line between them: the words on the right side of the front of the
// page, joined by one red line, in the veteran's order.
//
// He states the chain; the app never builds it. The picks below are only the
// labels already in his own record (what he was around, what changed), listed
// as they are, so he does not have to retype them. The app never adds a word,
// never moves one, and never proposes which word follows which.

const MAX = 9;
const DETAIL_MAX = 80;

// The line under a word saves itself as he types. The page holds 80
// characters; the box says so instead of cutting words off without a word.
function LinkDetail({ link, onError }: { link: FpChainLink; onError: (e: string) => void }) {
  const { supabase } = useAuth();
  const [v, setV] = useState(link.detail ?? "");
  const { status } = useAutosave(v, async (val) => {
    const r = await updateSimple(supabase, "fp_chain", link.id, { detail: val.trim() || null });
    if (!r.ok) { onError(r.error); return false; }
    return true;
  });
  return (
    <div className="mt-2">
      <Input label="One line under it (optional)" id={`detail-${link.id}`} value={v} onChange={(x) => setV(x.slice(0, DETAIL_MAX))} placeholder="e.g. Since 2010" />
      <div className="mt-1 flex items-center justify-between gap-3">
        <SavedMark status={status} />
        {v.length > DETAIL_MAX - 20 && <span className="text-[0.8125rem] text-muted">{v.length} of {DETAIL_MAX}</span>}
      </div>
    </div>
  );
}

export default function ChainEditor() {
  const { supabase, user } = useAuth();
  const [allLinks, setLinks] = useState<FpChainLink[]>([]);
  const [around, setAround] = useState<string[]>([]);
  const [changed, setChanged] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [word, setWord] = useState("");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const { offer } = useUndo();
  const links = allLinks.filter((l) => !hidden.includes(l.id));

  const refresh = useCallback(async () => {
    const r = await listSimple<FpChainLink>(supabase, "fp_chain");
    if (!r.ok) { setError(r.error); return; }
    setLinks(r.data);
  }, [supabase]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      await refresh();
      const [ci, cond] = await Promise.all([
        supabase.from("check_ins").select("exposures(exposure_class), incidents(incident_class)"),
        supabase.from("conditions").select("label").order("created_at"),
      ]);
      const a = new Set<string>();
      for (const row of (ci.data ?? []) as { exposures: { exposure_class: string }[] | null; incidents: { incident_class: string }[] | null }[]) {
        for (const e of row.exposures ?? []) a.add(EXPOSURE_LABEL[e.exposure_class] ?? e.exposure_class);
        for (const i of row.incidents ?? []) a.add(INCIDENT_LABEL[i.incident_class] ?? i.incident_class);
      }
      setAround(Array.from(a));
      setChanged(Array.from(new Set(((cond.data ?? []) as { label: string }[]).map((c) => c.label))));
    })();
  }, [user, supabase, refresh]);

  async function add(w: string, d: string) {
    const clean = w.trim().slice(0, 60);
    if (!clean || links.length >= MAX) return;
    setBusy(true);
    setError("");
    const r = await insertSimple<FpChainLink>(supabase, "fp_chain", { word: clean, detail: d.trim().slice(0, 80) || null, sort: links.length });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setWord("");
    setDetail("");
    refresh();
  }

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    const next = [...links];
    [next[i], next[j]] = [next[j], next[i]];
    setLinks(next);
    await Promise.all(next.map((l, k) => (l.sort === k ? null : updateSimple(supabase, "fp_chain", l.id, { sort: k }))));
    refresh();
  }

  // Remove is held behind the Undo bar and carried out when the bar closes.
  function remove(l: FpChainLink) {
    setHidden((h) => [...h, l.id]);
    offer({
      message: `Took "${l.word}" off the chain.`,
      commit: async () => { await deleteSimple(supabase, "fp_chain", l.id); setHidden((h) => h.filter((x) => x !== l.id)); refresh(); },
      undo: () => setHidden((h) => h.filter((x) => x !== l.id)),
    });
  }

  if (!user) return <Notice>Sign in to build your First Page.</Notice>;
  const inChain = new Set(links.map((l) => l.word.toLowerCase()));
  const picks = (xs: string[]) => xs.filter((x) => !inChain.has(x.toLowerCase()));
  const full = links.length >= MAX;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <BackToHub />
      <Notice>
        These words print on the front of your page, top to bottom, joined by one line. They are yours: the app never
        adds a word, never moves one, and never says what leads to what. Under the chain, the page says: This is my
        record, not a diagnosis.
      </Notice>
      <Notice error={error} />

      <section className="card p-5 sm:p-6">
        <CardTitle lede={links.length ? "Top to bottom, the order you lived it. Use Up and Down to change it." : "Nothing in the chain yet. Add the first word below."}>
          Your chain
        </CardTitle>
        {links.length > 0 && (
          <ol className="mt-4 space-y-3">
            {links.map((l, i) => (
              <li key={l.id} className="rounded-xl border border-line p-3.5 sm:p-4">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="mt-1.5 h-3 w-3 flex-none rounded-full border-[2.5px] border-flag bg-white" />
                  <div className="min-w-0 flex-1">
                    <p className="display text-[1.375rem] leading-tight text-ink">{l.word}</p>
                    <LinkDetail link={l} onError={setError} />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="btn btn-secondary btn-sm min-h-11" aria-label={`Move ${l.word} up`}>Up</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === links.length - 1} className="btn btn-secondary btn-sm min-h-11" aria-label={`Move ${l.word} down`}>Down</button>
                  <span className="flex-1" />
                  <button type="button" onClick={() => remove(l)} className="btn btn-ghost min-h-11 text-muted hover:text-scarlet">Remove</button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="card p-5 sm:p-6">
        <CardTitle lede={full ? `The chain holds ${MAX} words. Remove one to add another.` : "Tap a word from your record to add it to the bottom of the chain, or write your own."}>
          Add a word
        </CardTitle>
        {!full && (
          <div className="mt-5 space-y-5">
            <QuickPicks label="What you were around" picks={picks(around)} onPick={(p) => add(p, "")} />
            <QuickPicks label="What changed" picks={picks(changed)} onPick={(p) => add(p, "")} />
            <Input label="Or in your own words" value={word} onChange={setWord} placeholder="e.g. Blast overpressure" voice />
            <Input label="One line under it (optional)" value={detail} onChange={setDetail} placeholder="e.g. Breaching, 2010 to 2012" />
            <PrimaryButton large onClick={() => add(word, detail)} disabled={busy || word.trim().length < 2}>
              {busy ? "Saving…" : "Add to the chain"}
            </PrimaryButton>
          </div>
        )}
      </section>
    </div>
  );
}
