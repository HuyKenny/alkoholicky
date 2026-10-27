// Category illustrations (Canva, 28. 10. 2026, public/a/ik/<name>.webp, 256 px, transparent): slug → illustration.
// A subcategory falls back to its nearest ancestor that has one (skotske-whisky → whisky).
import type { Cat } from './db';

const MAP: Record<string, string> = {
  'lihoviny': 'sud', 'whisky-a-ochucene-whisky': 'whisky', 'skotske-whisky': 'whisky', 'americke-whiskey': 'whisky', 'irske-whiskey': 'whisky',
  'rumy-a-ochucene-rumy': 'rum', 'giny': 'gin', 'vodky-a-ochucene-vodky': 'vodka', 'likery': 'likery', 'ovocny-liker': 'likery',
  'konaky': 'konak', 'konaky-armanaky-a-vinovice': 'konak', 'armanaky': 'konak', 'brandy-a-gruzinak': 'konak', 'tequily': 'tequila',
  'tequily-mezcaly': 'tequila', 'mezcaly': 'tequila', 'vina': 'vino', 'cervena-vina': 'vino', 'bila-vina': 'vino', 'ruzova-vina': 'vino',
  'sumiva-a-perliva-vina': 'sumive', 'prosecco': 'sumive', 'champagne-sampanske-vino': 'sumive', 'sekty-sumiva-vina': 'sumive',
  'piva': 'pivo', 'cidery': 'pivo', 'miniatury-alkoholu': 'miniatury', 'nealko': 'nealko', 'limonady': 'nealko', 'sirupy': 'nealko',
  'tonic': 'nealko', 'darkove-baleni': 'darky', 'darkova-baleni-alkoholu': 'darky', 'darkove-boxy': 'darky', 'palenky-a-ovocne-destilaty': 'sud',
};

/** 256 px illustration; `small` = the 96 px variant for icons shown ≤ 48 px (menu, header, headings). */
export const ikona = (name: string, small = false) => `/a/ik/${small ? 's/' : ''}${name}.webp`;

/** Illustration of a category (own or of the nearest ancestor), or null. */
export function catIcon(slug: string, tree?: { byId: Map<number, Cat>; bySlug: Map<string, Cat> }): string | null {
  if (MAP[slug]) return ikona(MAP[slug]);
  let c = tree?.bySlug.get(slug);
  const seen = new Set<number>();
  while (c && !seen.has(c.id)) {
    seen.add(c.id);
    if (MAP[c.slug]) return ikona(MAP[c.slug]);
    c = tree?.byId.get(c.parent);
  }
  return null;
}
