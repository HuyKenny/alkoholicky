// Automatic category membership (from eroka). alkoholicky.cz keeps its WooCommerce categories 1:1 and has no rules yet
// (27. 10. 2026); add one when a category stays empty while the feeds have matching products. Each rule adds the products that match it
// to the target category and its ancestors as cat_products rows with direct = 2; rules run nightly (facets.ts) in this
// order, so a later rule (the audience hubs at the end) sees the members added by earlier ones. Manual rows (direct 0/1)
// are never touched. `within` limits a rule to products already in those category subtrees ('*' = whole catalogue).
// Facet landings (src/data/fasety.ts) get their rules generated from that table and run last.

import { FASETY } from '../../../src/data/fasety';

export interface Rule {
  cat: string;                       // target category slug
  any: Array<{ within: string[]; name?: RegExp; param?: { key: string; values: string[] }; brand?: string[] }>;
  not?: RegExp;                      // exclude by product name
}

export const RULES: Rule[] = [
  // facet landings: param value OR brand OR product name, within the base category
  ...FASETY.map((f): Rule => ({
    cat: f.slug,
    any: [
      ...(f.key && f.key !== 'brand' ? [{ within: [f.base], param: { key: f.key, values: [f.value!] } }] : []),
      ...(f.key === 'brand' ? [{ within: [f.base], brand: [f.value!] }] : []),
      ...(f.re ? [{ within: [f.base], name: f.re }] : []),
      ...(f.also ? [f.also] : []),
    ],
  })),
];
