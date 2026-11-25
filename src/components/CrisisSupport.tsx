"use client";

import { useState } from "react";

export default function CrisisSupport() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50 print:hidden">
      {open ? (
        <div className="card card-raise w-[19rem] p-4">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold text-ink">You are not alone</span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close support panel"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            The Veterans Crisis Line is free, confidential, and there 24/7. Reaching out is strength.
          </p>
          <div className="mt-3 space-y-2">
            <a href="tel:988" className="btn btn-primary w-full">
              Call 988, then press 1
            </a>
            <a href="sms:838255" className="btn btn-secondary w-full">
              Text 838255
            </a>
            <a
              href="https://www.veteranscrisisline.net/get-help-now/chat/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary w-full"
            >
              Chat online
            </a>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="btn btn-secondary card-raise rounded-full"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-success" aria-hidden="true" />
          Need support?
        </button>
      )}
    </div>
  );
}
