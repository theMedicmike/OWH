// THE BOOK SWITCH — is the book readable on this site?
//
// false (since 2026-09-28): the book is private until every real person in it has read their part and
// approved it (Michael's standing rule). With this off, /book and every /book/<chapter> return 404, the
// chapters leave the sitemap, robots.txt disallows /book, and every "Read the book" link disappears.
// Nothing is deleted: src/content/book.ts, the pages and the reader are all still here.
//
// To put the book back: set this to true, build, deploy. That is the whole change.
export const BOOK_PUBLIC = false;
