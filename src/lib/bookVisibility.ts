// THE BOOK SWITCH — is the book readable on this site?
//
// false (since 2026-09-28): the book is private until every real person in it has read their part and
// approved it (Michael's standing rule). With this off, /book and every /book/<chapter> return 404, the
// chapters leave the sitemap, robots.txt disallows /book, and every "Read the book" link disappears.
// Nothing is deleted: src/content/book.ts, the pages and the reader are all still here.
//
// To put the book back: set this to true, build, deploy. That is the whole change.
export const BOOK_PUBLIC = false;

// The book itself is public on its own site (whathappenedtoourveterans.com, free, no sign-up), along
// with both bills. While BOOK_PUBLIC is false, every "read the book" mention here links out to it
// instead of to /book. Its router accepts a chapter's base slug after the #, numbered or not.
export const BOOK_SITE = "https://whathappenedtoourveterans.com";
