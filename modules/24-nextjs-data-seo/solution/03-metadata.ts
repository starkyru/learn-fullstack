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

/** "team-sprint" → "Team Sprint". Deterministic; drives both the title and the OG alt. */
function toTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Builds the OG-image descriptor. The `url` points at a dynamic OG route with the title
 * and theme encoded as query params (URLSearchParams gives deterministic encoding), sized
 * to the 1200×630 OG standard.
 */
export function buildOgImageUrl(opts: { title: string; theme?: string }): OgImage {
  const params = new URLSearchParams({
    title: opts.title,
    theme: opts.theme ?? "light",
  });
  return {
    url: `/og?${params.toString()}`,
    width: 1200,
    height: 630,
    alt: opts.title,
  };
}

/** ISR config for the marketing route — mirrors `export const revalidate = 3600`. */
export function getIsrConfig(): IsrConfig {
  return { revalidate: 3600, dynamicParams: true };
}

/** Pure `generateMetadata`: exact SEO object for the given route params. */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<RouteMetadata> {
  const title = toTitle(params.slug);
  return {
    title: `${title} · Kanban`,
    description: `Plan, track, and ship the ${title} workflow with Kanban.`,
    openGraph: { images: [buildOgImageUrl({ title })] },
  };
}
