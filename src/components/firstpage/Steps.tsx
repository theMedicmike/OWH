"use client";

import { useCallback, useEffect, useState } from "react";

// One task per screen. A long form becomes numbered steps with a plain
// progress line ("2 of 8"), Back and Next. The step lives in the address
// (?step=2), so a refresh or a return visit lands on the same step.

export function useStep(total: number): [number, (n: number) => void] {
  const [step, setStepState] = useState(0);

  useEffect(() => {
    const n = parseInt(new URLSearchParams(window.location.search).get("step") ?? "1", 10);
    if (Number.isFinite(n) && n >= 1 && n <= total) queueMicrotask(() => setStepState(n - 1));
  }, [total]);

  const setStep = useCallback((n: number) => {
    const clamped = Math.max(0, Math.min(total - 1, n));
    setStepState(clamped);
    const url = new URL(window.location.href);
    url.searchParams.set("step", String(clamped + 1));
    window.history.replaceState(null, "", url.toString());
    window.scrollTo({ top: 0 });
  }, [total]);

  return [step, setStep];
}

export function StepNav({ steps, step, status }: { steps: string[]; step: number; status?: React.ReactNode }) {
  const pct = ((step + 1) / steps.length) * 100;
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[0.9375rem] font-semibold text-brand">
          {step + 1} of {steps.length}
          <span className="font-normal text-muted">. {steps[step]}</span>
        </p>
        {status}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Buttons({
  step, total, onBack, onNext, done, nextLabel = "Next",
}: { step: number; total: number; onBack: () => void; onNext: () => void; done?: React.ReactNode; nextLabel?: string }) {
  const last = step === total - 1;
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-line pt-4 max-sm:flex-col-reverse max-sm:items-stretch">
      {step > 0 && (
        <button type="button" onClick={onBack} className="btn btn-secondary btn-lg max-sm:w-full">Back</button>
      )}
      <span className="flex-1 max-sm:hidden" />
      {last ? done : (
        <button type="button" onClick={onNext} className="btn btn-primary btn-lg max-sm:w-full">{nextLabel}</button>
      )}
    </div>
  );
}

StepNav.Buttons = Buttons;
