// Product photos are taken from the partners' feeds (alcohol shops) and resized on the fly by wsrv.nl (images.weserv.nl):
// nothing is stored on Cloudflare (Kenny, 27. 10. 2026: šetřit místo). wsrv.nl blocks only adult domains (eroka needed its
// own Worker), the alcohol shops pass. Dead hosts are skipped, the page then shows the placeholder.
import { DEAD_IMAGE_HOSTS, WIDTHS } from './image-hosts';

export { WIDTHS };
export type Width = (typeof WIDTHS)[number];

/** Feeds sometimes put text ("in stock") or a broken host into the image field. */
export function validImage(url: string | null | undefined): string {
  const u = String(url ?? '').trim().replace(/^http:\/\//i, 'https://');
  if (!/^https:\/\/[^\s/]+\.[^\s/]+\//i.test(u) || /%20/.test(u.split('/')[2] ?? '')) return '';
  return u;
}

/** URL of the photo fitted inside w × w px (never enlarged), WebP, white background for transparent packshots. */
export function thumb(url: string | null | undefined, w: Width): string {
  const src = validImage(url);
  if (!src) return '';
  let u: URL;
  try { u = new URL(src); } catch { return ''; }
  if (DEAD_IMAGE_HOSTS.includes(u.hostname)) return '';
  return `https://wsrv.nl/?url=${encodeURIComponent(src.replace(/^https:\/\//, ''))}&w=${w}&h=${w}&fit=inside&we&output=webp&q=78`;
}

/** src + srcset (1× / 2×) for an image shown at `css` px. */
export function picture(url: string | null | undefined, css: 160 | 240 | 320 | 480): { src: string; srcset: string } | null {
  const pairs: Record<number, [Width, Width]> = { 160: [160, 320], 240: [320, 480], 320: [320, 640], 480: [480, 960] };
  const [a, b] = pairs[css]!;
  const one = thumb(url, a);
  if (!one) return null;
  return { src: one, srcset: `${one} 1x, ${thumb(url, b)} 2x` };
}

/** Own uploads (article photos) as site-relative paths, so every host (staging, workers.dev) serves its own copy. */
export const ownUpload = (u: string | null | undefined) => String(u ?? '').replace(/^https?:\/\/(www\.)?alkoholicky\.cz(?=\/(wp-content|a)\/)/, '');
