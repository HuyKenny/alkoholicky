import type { APIRoute } from 'astro';
import { getEnv } from '../lib/server/env';

export const prerender = false;
// Production robots.txt (27. 10. 2026, Astro): the WordPress rules without Crawl-delay (the Worker serves from the edge
// cache, Seznam/Bing no longer need to be slowed down). Filtered/sorted listings stay out of the crawl (they are noindex),
// affiliate exits and the API are not for crawlers; SEO crawlers Kenny blocked on WordPress stay blocked.
const PROD = `User-agent: *
Disallow: /go/
Disallow: /api/
Disallow: /*?*orderby=
Disallow: /*?*min_price=
Disallow: /*?*max_price=
Disallow: /*?*znacka=
Disallow: /*?*obchod=
Disallow: /*?*filter_
Disallow: /*?*product_brand=
Disallow: /*?*p_

${['GPTBot', 'ClaudeBot', 'Claude-SearchBot', 'OAI-SearchBot', 'PerplexityBot', 'CCBot', 'Applebot-Extended', 'Google-Extended'].map((b) => `User-agent: ${b}\nCrawl-delay: 10\nDisallow: /go/\nDisallow: /api/\n`).join('\n')}
${['AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'BLEXBot', 'PetalBot', 'Baiduspider', 'Amazonbot'].map((b) => `User-agent: ${b}\nDisallow: /\n`).join('\n')}
Sitemap: https://alkoholicky.cz/sitemap_index.xml
`;
export const GET: APIRoute = () => {
  const prod = getEnv().ENVIRONMENT === 'production';
  return new Response(prod ? PROD : 'User-agent: *\nDisallow: /\n', { headers: { 'content-type': 'text/plain; charset=UTF-8', 'cache-control': 'public, max-age=3600' } });
};
