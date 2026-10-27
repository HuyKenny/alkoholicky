// Shop display names (offers only carry the domain), their favicons (public/wp-content/uploads/ce-logos, from Content Egg)
// and full logos (public/a/ob, none yet on alkoholicky.cz — the homepage then shows favicon + name).
import logos from '../data/shop-logos.json';
const NAMES: Record<string, string> = {
  'alkohol.cz': 'Alkohol.cz', 'drinkcentrum.cz': 'DrinkCentrum', 'svetnapoju.cz': 'Svět nápojů', 'topalkohol.cz': 'Topalkohol',
  'vinisto.cz': 'Vinisto', 'vinokral.cz': 'Vínokrál', 'barman.cz': 'Barman.cz', 'ocenenavina.cz': 'Oceněná vína', 'warehouse1.cz': 'Warehouse #1',
  'dramroom.cz': 'DramRoom', 'lihovarek.cz': 'Lihovárek', 'osobnivinoteka.cz': 'Osobní vinotéka', 'panalfred.cz': 'Pan Alfred',
  'wineplanet.cz': 'Wineplanet', 'simplywines.cz': 'SimplyWines', 'donpealo.cz': 'Don Pealo', 'destilerka.cz': 'Destilérka', '4bar.cz': '4bar',
  'alza.cz': 'Alza.cz', 'rohlik.cz': 'Rohlík.cz', 'rjelinek.cz': 'R. Jelínek', 'babickarstvi.cz': 'Babičkářství', 'bottlesandstories.cz': 'Bottles & Stories',
  'familium.cz': 'Familium', 'bestdrink.cz': 'Bestdrink',
};
export const shopName = (domain: string) => NAMES[domain] ?? domain;
/** Brand colour of a shop (stripe on the homepage shop tiles); unknown shops get the site green. */
const COLORS: Record<string, string> = {
  'alkohol.cz': '#B3122E', 'drinkcentrum.cz': '#E30613', 'svetnapoju.cz': '#00A0E3', 'topalkohol.cz': '#1D1D1B', 'vinisto.cz': '#7A1F3D',
  'vinokral.cz': '#8E1B3C', 'barman.cz': '#C8102E', 'ocenenavina.cz': '#B08D57', 'warehouse1.cz': '#1F1F1F', 'dramroom.cz': '#C49A3A',
  'lihovarek.cz': '#2F6B3A', 'osobnivinoteka.cz': '#6B2142', 'panalfred.cz': '#0E2A47', 'wineplanet.cz': '#5B2A86', 'simplywines.cz': '#D4145A',
  'donpealo.cz': '#E2001A', 'destilerka.cz': '#A0522D', '4bar.cz': '#F39200', 'alza.cz': '#21A1E1', 'rohlik.cz': '#5DA130',
};
export const shopColor = (domain: string) => COLORS[domain] ?? '#0F4D3A';
export const shopIcon = (domain: string) => `/wp-content/uploads/ce-logos/icon_${domain.replace(/\./g, '-')}.png`;

/** Full logo with a display size of similar visual weight (width grows with √ aspect ratio), or null. */
export function shopLogo(domain: string): { src: string; w: number; h: number } | null {
  const d = (logos as Record<string, [number, number]>)[domain];
  if (!d) return null;
  const r = d[0] / d[1];
  let h = Math.sqrt(3600 / r), w = h * r;
  if (w > 132) { w = 132; h = w / r; }
  if (h > 40) { h = 40; w = h * r; }
  return { src: `/a/ob/${domain.replace(/\./g, '-')}.webp`, w: Math.round(w), h: Math.round(h) };
}
