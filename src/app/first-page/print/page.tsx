import { Suspense } from "react";
import FirstPagePrint from "@/components/firstpage/FirstPagePrint";

// No AppShell: the sidebar must not print and the sheet must be exactly
// US Letter. useSearchParams needs a Suspense boundary in the App Router.
export default function FirstPagePrintPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted">Building your page…</p>}>
      <FirstPagePrint />
    </Suspense>
  );
}
