// robots.txt (CHECKLIST G7): the teaser is indexable and names the sitemap; a staging build disallows everything, as
// its pages already carry noindex (Base.astro).
import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/site.ts';

export const GET: APIRoute = () => {
  const staging = import.meta.env.PUBLIC_STAGING === '1';
  const body = `User-agent: *\n${staging ? 'Disallow: /' : 'Allow: /'}\n\nSitemap: ${new URL('/sitemap.xml', SITE_URL).href}\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
