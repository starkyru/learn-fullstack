import type { ReactElement, ReactNode } from "react";

/**
 * The root layout — the top of every App Router tree. It wraps the whole app in
 * `<html>`/`<body>` and a `<main>` mount point. In Next it's an async Server
 * Component; here it's a plain `async` function returning the element tree, so a
 * test can `await` it and inspect the structure directly (no renderer needed).
 */
export async function RootLayout({
  children,
}: {
  children: ReactNode;
}): Promise<ReactElement> {
  return (
    <html lang="en">
      <body>
        <main id="app">{children}</main>
      </body>
    </html>
  );
}

/**
 * WORKED EXAMPLE — the layout for the `/board` route segment. A segment layout
 * renders once and wraps the segment's `children` (the page + any nested routes)
 * with shared chrome: here a nav and a content `<section>`. It passes `children`
 * straight through — a layout never owns the page's data, only its frame.
 */
export async function BoardLayout({
  children,
}: {
  children: ReactNode;
}): Promise<ReactElement> {
  return (
    <div className="board-layout">
      <nav aria-label="board-nav">
        <a href="/board">Board</a>
      </nav>
      <section aria-label="board-content">{children}</section>
    </div>
  );
}

/**
 * ANALOG (learner builds this in src/) — the layout for the nested
 * `/board/card/[id]` route. Same idea as `BoardLayout`: an async function that
 * wraps `children`, but with a back-link to `/board` and an `<article>` holding
 * the card's content.
 */
export async function CardDetailLayout({
  children,
}: {
  children: ReactNode;
}): Promise<ReactElement> {
  return (
    <div className="card-detail">
      <a href="/board">Back to board</a>
      <article aria-label="card-detail-content">{children}</article>
    </div>
  );
}
