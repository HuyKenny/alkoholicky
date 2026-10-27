// Product parameters as the site shows and filters them. Values come from the importer (workers/import/src/params.ts);
// volume and strength are filtered by buckets (same ids as BUCKETS in workers/import/src/facets.ts).

export const PARAM_ORDER = ['objem', 'alkohol', 'zeme'] as const;
export type ParamKey = (typeof PARAM_ORDER)[number];
export const PARAM_LABEL: Record<ParamKey, string> = { objem: 'Objem', alkohol: 'Obsah alkoholu', zeme: 'Země původu' };
export const BUCKETS: Partial<Record<ParamKey, Array<[string, string, number, number]>>> = {
  objem: [['do-0-5', 'do 0,5 l', 0, 0.5], ['0-5-0-7', '0,5–0,7 l', 0.5, 0.71], ['0-7-1', '0,7–1 l', 0.71, 1.01], ['nad-1', 'nad 1 l', 1.01, 999]],
  alkohol: [['do-20', 'do 20 %', 0, 20], ['20-38', '20–38 %', 20, 38], ['38-42', '38–42 %', 38, 42.01], ['nad-42', 'nad 42 %', 42.01, 999]],
};

/** ASCII slug of a parameter value for URLs (?p_zeme=skotsko,irsko). */
export const valueSlug = (v: string) => v.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Display value: numbers get their unit. */
export function paramText(key: ParamKey, values: string[]): string {
  if (key === 'objem') return values.map((v) => v.replace('.', ',') + ' l').join(', ');
  if (key === 'alkohol') return values.map((v) => v.replace('.', ',') + ' %').join(', ');
  return values.join(', ');
}
