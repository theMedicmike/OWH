"use client";

import { useState } from "react";

export default function CrisisSupport() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50 print:hidden">
      {open ? (
        <div className="w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">You&apos;re not alone</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close support panel"
              className="text-lg leading-none text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              ×
            </button>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">
            The Veterans Crisis Line is free, confidential, and there 24/7. Reaching out is strength.
          </p>
          <div className="mt-3 space-y-2">
            <a
              href="tel:988"
              className="block rounded-md bg-zinc-900 px-3 py-2 text-center text-sm font-medium text-white hover:opacity-90 dark:bg-white dark:text-zinc-900"
            >
              Call 988, then press 1
            </a>
            <a
              href="sms:838255"
              className="block rounded-md border border-zinc-300 px-3 py-2 text-center text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Text 838255
            </a>
            <a
              href="https://www.veteranscrisisline.net/get-help-now/chat/"
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-md border border-zinc-300 px-3 py-2 text-center text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Chat online
            </a>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-md hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          Need support?
        </button>
      )}
    </div>
  );
}
