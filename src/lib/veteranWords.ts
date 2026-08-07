// The ONE filter between a veteran's raw check-in notes and every deliverable
// (the claim packet, the PDF, and the standalone statement). If the statement
// and the packet ever filtered differently, the veteran's words would fork —
// so this module is the single source of truth.

// Machine-generated note lines never print as the veteran's words.
//
// 🔴 "Basic training / boot camp." is written by the APP, in lib/bootCamp.ts, when
// it creates the boot-camp pin. It was missing from this list, so it flowed
// straight through into a document titled "My Statement — In My Own Words" that
// says "exactly as you wrote it" and carries a signature line — and into the
// "in the veteran's words" lines of the claim packet. A veteran was being asked
// to sign, and hand to a VSO, a sentence the software wrote for him. Nothing the
// app authors may ever be presented back to him as his own testimony.
//
// If you add another auto-written note anywhere, add its prefix here in the same
// commit.
export const MACHINE_NOTE = /^(Location not yet pinned|Location approximate|Other exposure noted:|Basic training \/ boot camp\.?$)/;

export function veteranWords(notes: string | null | undefined): string {
  return (notes ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !MACHINE_NOTE.test(l))
    .join(" ")
    .trim();
}

// The veteran's free-text exposure ("sodium dichromate at Qarmat Ali") — often
// the most specific evidence they have.
export function otherExposure(notes: string | null | undefined): string | null {
  for (const l of (notes ?? "").split("\n")) {
    const m = l.trim().match(/^Other exposure noted:\s*(.+)/);
    if (m) return m[1].trim();
  }
  return null;
}
