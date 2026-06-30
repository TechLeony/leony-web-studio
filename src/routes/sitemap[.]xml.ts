import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://leony.tech";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const SECTOR_SLUGS = [
  "cafe-restoran",
  "klinik-dis-klinigi",
  "guzellik-salonu-nail-studio",
  "barber-kuafor",
  "vet-klinik",
  "terapist-psikolog",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/demo/mira-cafe", changefreq: "monthly", priority: "0.7" },
          { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
          { path: "/kvkk", changefreq: "yearly", priority: "0.3" },
          ...SECTOR_SLUGS.map<SitemapEntry>((slug) => ({
            path: `/sektor/${slug}`,
            changefreq: "monthly",
            priority: "0.7",
          })),
        ];

        const urls = entries
          .map((e) =>
            [
              `  <url>`,
              `    <loc>${BASE_URL}${e.path}</loc>`,
              e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
              e.priority ? `    <priority>${e.priority}</priority>` : null,
              `  </url>`,
            ]
              .filter(Boolean)
              .join("\n"),
          )
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
