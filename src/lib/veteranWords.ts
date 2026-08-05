// The ONE filter between a veteran's raw check-in notes and every deliverable
// (the claim packet, the PDF, and the standalone statement). If the statement
// and the packet ever filtered differently, the veteran's words would fork —
// so this module is the single source of truth.

// Machine-generated note lines never print as the veteran's words.
export const MACHINE_NOTE = /^(Location not yet pinned|Location approximate|Other exposure noted:)/;

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
