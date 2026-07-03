import { describe, expect, it } from "vitest";
import {
  buildOgImageUrl,
  generateMetadata,
  getIsrConfig,
} from "../solution/03-metadata.js";

describe("SSG/ISR + metadata", () => {
  it("generateMetadata returns the exact SEO object for a slug", async () => {
    const meta = await generateMetadata({ params: { slug: "team-sprint" } });
    expect(meta).toEqual({
      title: "Team Sprint · Kanban",
      description: "Plan, track, and ship the Team Sprint workflow with Kanban.",
      openGraph: {
        images: [
          {
            url: "/og?title=Team+Sprint&theme=light",
            width: 1200,
            height: 630,
            alt: "Team Sprint",
          },
        ],
      },
    });
  });

  it("title-cases a single-word slug", async () => {
    const meta = await generateMetadata({ params: { slug: "roadmap" } });
    expect(meta.title).toBe("Roadmap · Kanban");
    expect(meta.openGraph.images[0]!.alt).toBe("Roadmap");
  });

  it("buildOgImageUrl encodes title + theme and uses the 1200×630 OG size", () => {
    expect(buildOgImageUrl({ title: "Team Sprint", theme: "dark" })).toEqual({
      url: "/og?title=Team+Sprint&theme=dark",
      width: 1200,
      height: 630,
      alt: "Team Sprint",
    });
  });

  it("buildOgImageUrl defaults the theme to light", () => {
    expect(buildOgImageUrl({ title: "Roadmap" }).url).toBe(
      "/og?title=Roadmap&theme=light",
    );
  });

  it("getIsrConfig revalidates hourly with dynamic params on", () => {
    expect(getIsrConfig()).toEqual({ revalidate: 3600, dynamicParams: true });
  });
});
