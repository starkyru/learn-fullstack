/**
 * SSG/ISR + metadata for a statically generated marketing page. In the App Router these
 * are module-level exports on a `page.tsx`:
 *   - `export const revalidate = 3600`  → ISR: re-render at most hourly
 *   - `export async function generateMetadata({ params })` → per-route <head> tags
 *   - an OG image referenced from `openGraph.images`
 * Here each is a PURE function returning a plain object, so the exact SEO output is
 * asserted directly — no Next runtime required.
 */

export interface OgImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

export interface RouteMetadata {
  title: string;
  description: string;
  openGraph: { images: OgImage[] };
}

export interface IsrConfig {
  /** Seconds between background regenerations (Next's `export const revalidate`). */
  revalidate: number;
  /** Whether params outside `generateStaticParams` are rendered on-demand. */
  dynamicParams: boolean;
}

/**
 * YOUR TURN — build the OG-image descriptor. Encode `title` and `theme` (default
 * "light") into a query string with `URLSearchParams` (deterministic encoding), set
 * `url` to `/og?<params>`, and return the 1200×630 OG size with `alt` set to the title.
 */
export function buildOgImageUrl(_opts: { title: string; theme?: string }): OgImage {
  throw new Error("TODO: return { url: `/og?<params>`, width: 1200, height: 630, alt }");
}

/**
 * YOUR TURN — return the ISR config for the marketing route: `revalidate` of 3600
 * seconds (one hour) and `dynamicParams: true`. This mirrors `export const revalidate`.
 */
export function getIsrConfig(): IsrConfig {
  throw new Error("TODO: return { revalidate: 3600, dynamicParams: true }");
}

/**
 * YOUR TURN — build the exact metadata object for `params.slug`. Title-case the slug
 * ("team-sprint" → "Team Sprint"), then return `{ title: "<Title> · Kanban",
 * description: "Plan, track, and ship the <Title> workflow with Kanban.",
 * openGraph: { images: [buildOgImageUrl({ title })] } }`.
 */
export async function generateMetadata(_args: {
  params: { slug: string };
}): Promise<RouteMetadata> {
  throw new Error("TODO: title-case the slug and return the exact metadata object");
}
