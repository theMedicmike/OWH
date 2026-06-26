"use client";

export default function PrintButton({ label = "Print this page" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition hover:bg-brand-600 print:hidden"
    >
      {label}
    </button>
  );
}
