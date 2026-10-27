// Facet landing pages (27. 10. 2026): category × facet combinations people actually search for (Marketing Miner, cs,
// searches/month ≥ 20). Each one is a real category (child of `base`, URL in the root like every category) with its own
// H1/title/description, filled nightly by the importer rules built from this table (workers/import/src/category-rules.ts),
// indexed when it has ≥ 5 products. Combinations nobody searches (colours × vibrators/dildos …) stay plain filters (noindex).
// One table feeds the migration (scripts/gen-fasety-sql.ts), the importer rules and the filter links/redirects (views.ts).
// `id` = new category id (3001+); entries without `id` reuse an existing category of that slug.

export type FacetKey = 'zeme' | 'objem' | 'alkohol' | 'brand';
export interface Faseta {
  id?: number;
  slug: string;
  base: string;               // parent category slug (filters on that category link to this landing)
  name: string;               // H1
  keyword: string;            // searched form (title)
  volume: number;             // searches / month (Marketing Miner, 27. 10. 2026)
  key?: FacetKey;             // filter facet the landing stands for …
  value?: string;             // … canonical param value (product_params) or brand slug
  re?: RegExp;                // product-name match (in addition to the param / brand)
  also?: { within: string[]; name: RegExp };  // products of another subtree (latex clothing lives under Latex)
}

// alkoholicky.cz has no facet landings yet (27. 10. 2026) — the table is kept so views/importer stay generic.
export const FASETY: Faseta[] = [];

export function facetLanding(base: string, key: string, value: string): Faseta | undefined {
  return FASETY.find((f) => f.base === base && f.key === key && f.value === value);
}
