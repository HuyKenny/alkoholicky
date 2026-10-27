// Feed parameters → a few canonical keys used for filters and the spec table (alkoholicky.cz, 27. 10. 2026).
// Shops name them differently (Objem / Obsah / Velikost balení, Alkohol / Obsah alkoholu / % alk., Země / Země původu …),
// so names and values are mapped here; anything unknown is dropped (keeps the database small). The product title is a
// fallback source for volume and strength ("… 0,7l 40%").
// Keys and labels are shared with the site (src/lib/params.ts).

export type ParamKey = 'zeme' | 'objem' | 'alkohol';
export type Params = Partial<Record<ParamKey, string[]>>;

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

/** feed parameter name (normalised) → canonical key */
const NAMES: Record<string, ParamKey> = {
  zeme: 'zeme', 'zeme puvodu': 'zeme', puvod: 'zeme', 'zeme vyroby': 'zeme', country: 'zeme', 'g:country_of_origin': 'zeme',
  objem: 'objem', 'objem lahve': 'objem', 'objem (l)': 'objem', 'velikost baleni': 'objem', baleni: 'objem', obsah: 'objem', volume: 'objem',
  alkohol: 'alkohol', 'obsah alkoholu': 'alkohol', 'obsah alkoholu (%)': 'alkohol', 'alk.': 'alkohol', '% alk.': 'alkohol', 'alkohol (%)': 'alkohol', abv: 'alkohol',
  _title: 'objem',
};

const SINGLE: ParamKey[] = ['objem', 'alkohol'];

/** "0,7l", "700 ml", "0.5 L", "1,75l" → litres */
function litres(v: string): number | null {
  const s = norm(v).replace(',', '.');
  const ml = /(\d+(?:\.\d+)?)\s*ml\b/.exec(s);
  if (ml) return Math.round(Number(ml[1]) / 10) / 100;
  const cl = /(\d+(?:\.\d+)?)\s*cl\b/.exec(s);
  if (cl) return Math.round(Number(cl[1])) / 100;
  const l = /(\d+(?:\.\d+)?)\s*l\b/.exec(s) ?? /^(\d+(?:\.\d+)?)$/.exec(s);
  return l ? Number(l[1]) : null;
}
/** "40%", "40 % obj.", "40,5" → percent */
function percent(v: string): number | null {
  const s = norm(v).replace(',', '.');
  const m = /(\d{1,2}(?:\.\d)?)\s*%/.exec(s) ?? /^(\d{1,2}(?:\.\d)?)$/.exec(s);
  return m ? Number(m[1]) : null;
}

function values(key: ParamKey, raw: string): string[] {
  const v = raw.trim();
  if (!v) return [];
  switch (key) {
    case 'objem': { const n = litres(v); return n && n >= 0.02 && n <= 30 ? [String(n)] : []; }
    case 'alkohol': { const n = percent(v); return n !== null && n > 0 && n <= 96 ? [String(n)] : []; }
    case 'zeme': {
      const t = v.replace(/\s+/g, ' ');
      return t.length >= 3 && t.length <= 40 && !/\d/.test(t) ? [t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()] : [];
    }
  }
}

/** Collect canonical params from (name, value) pairs of one feed item; `title` fills volume/strength when missing. */
export function canonicalParams(pairs: Array<[string, string]>, title = ''): Params {
  const out: Params = {};
  for (const [rawName, raw] of pairs) {
    const key = NAMES[norm(rawName)];
    if (!key) continue;
    const vals = values(key, raw);
    if (!vals.length) continue;
    const cur = out[key] ?? [];
    out[key] = SINGLE.includes(key) ? (cur.length ? cur : vals.slice(0, 1)) : [...new Set([...cur, ...vals])].slice(0, 3);
  }
  if (title) {
    if (!out.objem) { const n = litres((/(\d+(?:[.,]\d+)?\s*(?:ml|cl|l))\b/i.exec(title) ?? [])[1] ?? ''); if (n && n >= 0.02 && n <= 30) out.objem = [String(n)]; }
    if (!out.alkohol) { const n = percent((/(\d{1,2}(?:[.,]\d)?\s*%)/.exec(title) ?? [])[1] ?? ''); if (n && n <= 96) out.alkohol = [String(n)]; }
  }
  return out;
}

/** Merge params of several offers of one product (offers already in feed-priority order). */
export function mergeParams(list: Params[]): Params {
  const out: Params = {};
  for (const p of list) {
    for (const [k, vals] of Object.entries(p) as Array<[ParamKey, string[]]>) {
      if (!vals?.length) continue;
      if (SINGLE.includes(k)) { if (!out[k]) out[k] = vals.slice(0, 1); }
      else out[k] = [...new Set([...(out[k] ?? []), ...vals])].slice(0, 3);
    }
  }
  return out;
}
