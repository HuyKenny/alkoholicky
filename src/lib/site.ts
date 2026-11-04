// Site-wide constants and the Rank Math JSON-LD base graph (Organization/WebSite), copied 1:1 from the WordPress output
// (27. 10. 2026) so the structured data Google knows does not change with the platform.
export const BASE = 'https://alkoholicky.cz';
export const SITE_NAME = 'Alkoholický';
export const GA4_ID = 'G-6LMH2TME9J';
/** Operator (fyzická osoba, ŽL od 6. 2. 2019, neplátce DPH); same text as in obchodni-podminky and zasadach-ochrany-osobnich-udaju. */
export const OPERATOR = { name: 'Ha Duy Huy', ico: '07876823', street: 'Bartáková 36', zip: '140 00', city: 'Praha', email: 'info@alkoholicky.cz' };
export const LOGO_URL = BASE + '/wp-content/uploads/2026/06/ah-logo-2026.png';
/** Share image for pages without their own photo (homepage photo on WordPress). */
export const OG_DEFAULT = BASE + '/wp-content/uploads/2022/11/wine-g43b983d30_1920.jpg';
export const OG_HOME = OG_DEFAULT;
export const PER_PAGE = 24;
export const POSTS_PER_PAGE = 12;

/** Founder (Kenny's personal site huy.cz is the Person entity; same node on all his projects). */
export const FOUNDER = { '@type': 'Person', '@id': 'https://huy.cz/#kenny', name: 'Ha Duy Huy', alternateName: 'Kenny', url: 'https://huy.cz/', jobTitle: 'SEO konzultant' };

/** `full` = Organization with logo (every page except product-category archives, where Rank Math prints a short node). */
export function orgGraph(short = false, searchAction = false): unknown[] {
  return [
    short
      ? { '@type': 'Organization', '@id': BASE + '/#organization', name: 'Alkoholický.cz', sameAs: ['https://www.facebook.com/alkoholicky'], founder: FOUNDER }
      : {
        '@type': 'Organization', '@id': BASE + '/#organization', name: 'Alkoholický.cz', url: BASE, sameAs: ['https://www.facebook.com/alkoholicky'],
        logo: { '@type': 'ImageObject', '@id': BASE + '/#logo', url: LOGO_URL, contentUrl: LOGO_URL, caption: SITE_NAME, inLanguage: 'cs', width: '600', height: '120' },
        image: { '@id': BASE + '/#logo' },
        founder: FOUNDER,
      },
    {
      '@type': 'WebSite', '@id': BASE + '/#website', url: BASE, name: SITE_NAME, alternateName: 'Srovnávač a vyhledávač alkoholu', publisher: { '@id': BASE + '/#organization' }, inLanguage: 'cs',
      ...(searchAction ? { potentialAction: { '@type': 'SearchAction', target: BASE + '/?s={search_term_string}', 'query-input': 'required name=search_term_string' } } : {}),
    },
  ];
}

/** Rank Math dates are local (Europe/Prague) with offset; D1 keeps WordPress' local "Y-m-dTH:i:s". */
export function isoPrague(local: string): string {
  const s = String(local || '').replace(' ', 'T').slice(0, 19);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(s)) return '';
  const d = new Date(s + 'Z');
  const name = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Prague', timeZoneName: 'shortOffset' }).formatToParts(d).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+1';
  const m = /GMT([+-])(\d{1,2})/.exec(name);
  const off = m ? `${m[1]}${m[2]!.padStart(2, '0')}:00` : '+01:00';
  return s + off;
}
