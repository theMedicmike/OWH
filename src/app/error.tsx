"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <h1 className="text-lg font-bold text-ink">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Sorry — something broke on our end. Your saved record is safe. Try again, and if it keeps
        happening, email michael@operationwholehealth.org.
      </p>
      <button
        onClick={() => reset()}
        className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-brand-600"
      >
        Try again
      </button>
      <p className="mt-6 text-xs text-faint">
        If things feel heavy, the Veterans Crisis Line is here 24/7 — dial 988, then press 1.
      </p>
    </div>
  );
}
