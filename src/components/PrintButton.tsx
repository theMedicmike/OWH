"use client";

export default function PrintButton({ label = "Print this page" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="btn btn-primary print:hidden"
    >
      {label}
    </button>
  );
}
