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
 * YOUR TURN (analog) — build `CardDetailLayout` the same way as `BoardLayout`:
 * an `async` function taking `{ children }` that returns
 *
 *   <div className="card-detail">
 *     <a href="/board">Back to board</a>
 *     <article aria-label="card-detail-content">{children}</article>
 *   </div>
 *
 * Pass `children` straight through into the `<article>` — the test awaits the
 * function and asserts the back-link `href` and that the article holds `children`.
 */
export async function CardDetailLayout(_props: {
  children: ReactNode;
}): Promise<ReactElement> {
  throw new Error("TODO: wrap children with a back-link and an <article>");
}
