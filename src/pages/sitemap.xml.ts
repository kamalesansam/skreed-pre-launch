// sitemap.xml (CHECKLIST G8; docs/specs/family-page.md acceptance 1): the landing, plus the ten family pages whenever the
// build emits them (FAMILY_PAGES, mode.ts). Prerendered to dist/sitemap.xml; robots.txt points here.
import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/site.ts';
import { FAMILIES } from '../scripts/family/data.ts';
import { familyPagesOn } from '../scripts/family/mode.ts';

function sitemapPaths(pages = familyPagesOn()): string[] {
  return ['/', ...(pages ? FAMILIES.map((f) => `/shades/${f.slug}/`) : [])];
}

export const GET: APIRoute = () => {
  const urls = sitemapPaths().map((p) => `  <url><loc>${new URL(p, SITE_URL).href}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
