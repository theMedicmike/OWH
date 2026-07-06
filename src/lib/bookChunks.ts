import type { BookParagraph } from "@/content/book";

// Read-aloud chunks = one per paragraph (headings included, read as their own
// chunk), kept 1:1 and in order with the rendered paragraphs so the follow-along
// highlight index maps directly to the DOM node at the same index. Empty chunks
// are left in place (speakChunks skips speaking them) to preserve that alignment.
export function chapterToChunks(paragraphs: BookParagraph[]): string[] {
  return paragraphs.map((p) => (p.text ?? "").trim());
}
