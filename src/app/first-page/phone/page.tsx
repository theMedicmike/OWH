import { Suspense } from "react";
import FirstPagePhone from "@/components/firstpage/FirstPagePhone";

export const metadata = { title: "Your First Page, on your phone", robots: { index: false, follow: false } };

export default function FirstPagePhonePage() {
  return (
    <Suspense>
      <FirstPagePhone />
    </Suspense>
  );
}
