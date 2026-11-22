// View models for each page type: data from D1 + SEO meta (title, description, canonical, prev/next, robots, JSON-LD)
// matching the WordPress/Rank Math output. Templates only render what these return.
import {
  ancestry, brandList, catImages, catTree, cardsByIds, comments, facets, listPosts, listProducts, loadBrand, loadCategory, loadPost, loadProduct,
  postCat, latestPosts, relatedPosts, relatedProducts, searchProducts, siteCache,
  type Card, type Cat, type Offer, type Post, type PostCard,
} from './db';
import { isFiltered, parseFilters, toListQuery, toQuery } from './filters';
import { BASE, OG_DEFAULT, PER_PAGE, POSTS_PER_PAGE, isoPrague } from './site';
import { shopName } from './shops';
import { categoryTitle, clamp, descFrom, paged, postTitle, productTitle, rmTitle, robots, searchTitle, termTitle } from './seo';
import { cislo, decode, produktu, stripTags } from './format';
import { validImage } from './img';
import postcatSeo from '../data/postcat-seo.json';

export interface Meta {
  title: string; description: string; canonical?: string; prev?: string; next?: string; robots: string[];
  ogType?: string; ogImage?: string; graph: unknown[]; jsonLd: unknown[]; extraMeta?: Array<{ property?: string; name?: string; content: string }>;
  /** Rank Math prints a short Organization node (no logo) on product-category archives. */
  shortOrg?: boolean;
}
export interface Crumb { name: string; url?: string }

const abs = (p: string) => BASE + p;
const pagePath = (base: string, n: number) => (n <= 1 ? base : `${base}page/${n}/`);
function breadcrumbLd(items: Crumb[]) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.url ?? '/') })),
  };
}
function itemListLd(url: string, name: string, items: Card[]) {
  const list = items.slice(0, 20);
  if (!list.length) return null;
  return {
    '@context': 'https://schema.org', '@type': 'ItemList', '@id': url + '#products', name, numberOfItems: list.length,
    itemListElement: list.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/${p.slug}/`), name: decode(p.name) })),
  };
}
function collection(url: string, title: string) {
  return { '@type': 'CollectionPage', '@id': url + '#webpage', url, name: title, isPartOf: { '@id': BASE + '/#website' }, inLanguage: 'cs' };
}

// ---------- category ----------
export interface FacetPage {
  id: number; slug: string; base_slug: string; qs: string; h1: string; seo_title: string; seo_desc: string; intro_html: string; second_html: string;
  faq_json: string; keyword: string; volume: number; min_products: number; total: number; noindex: number;
}
/** Facet landing = its base category with a preset filter (fp.qs) and its own texts; filters added by the visitor on top make it noindex like any filtered listing. */
export async function facetView(db: D1Database, id: number, page: number, sp: URLSearchParams) {
  const fp = await db.prepare('SELECT * FROM facet_pages WHERE id = ?').bind(id).first<FacetPage>();
  if (!fp) return null;
  const tree = await catTree(db);
  const base = tree.bySlug.get(fp.base_slug);
  if (!base) return null;
  const merged = new URLSearchParams(fp.qs);
  for (const k of new Set([...sp.keys()])) { merged.delete(k); for (const v of sp.getAll(k)) merged.append(k, v); }
  return categoryView(db, base.id, page, merged, { fp, user: sp });
}

/** H1 = the searched word (the category names are WordPress-era: "Rumy a ochucené rumy", "Giny"). The long name stays as the subtitle. */
const H1: Record<string, string> = {
  'rumy-a-ochucene-rumy': 'Rum', 'whisky-a-ochucene-whisky': 'Whisky', 'giny': 'Gin', 'vodky-a-ochucene-vodky': 'Vodka', 'tequily': 'Tequila', 'prosecco': 'Prosecco',
  'vina': 'Víno', 'pivo': 'Pivo', 'likery': 'Likér', 'konaky-armanaky-a-vinovice': 'Koňak', 'slivovice-svestkovice': 'Slivovice', 'sumiva-a-perliva-vina': 'Šumivé víno',
  'absinthy': 'Absinth', 'brandy-a-gruzinak': 'Brandy', 'lihoviny': 'Alkohol', 'champagne-sampanske-vino': 'Šampaňské', 'bila-vina': 'Bílé víno', 'cervena-vina': 'Červené víno',
  'ruzova-vina': 'Růžové víno', 'skotske-whisky': 'Skotská whisky', 'americke-whiskey': 'Bourbon a americká whiskey', 'irske-whiskey': 'Irská whiskey', 'tmave-rumy': 'Tmavý rum', 'bile-rumy': 'Bílý rum',
  'medovina': 'Medovina', 'cidery': 'Cider', 'tequily-mezcaly': 'Tequila a mezcal',
};
/** article slug keyword per category (related articles block) */
const ART: Record<string, string> = { 'rumy-a-ochucene-rumy': 'rum', 'whisky-a-ochucene-whisky': 'whisk', 'giny': 'gin', 'vodky-a-ochucene-vodky': 'vodk', 'tequily': 'tequil', 'prosecco': 'prosec',
  'vina': 'vin', 'pivo': 'piv', 'likery': 'liker', 'konaky-armanaky-a-vinovice': 'konak', 'slivovice-svestkovice': 'slivov', 'sumiva-a-perliva-vina': 'sumiv', 'absinthy': 'absint' };
export interface CData { n: number; lo: number; med: number; hi: number; u?: string; cheapest: Array<{ s: string; n: string; p: number; d: string; k: number }>;
  ppl?: Array<{ s: string; n: string; p: number; d: string; k: number; l: number }>; ppl_med?: number; ppa?: Array<{ s: string; n: string; p: number; d: string; a: number }>;
  shops: Array<{ d: string; n: number }>; deals: Array<{ s: string; n: string; p: number; d: string; x: number }>; top: Array<{ s: string; n: string; p: number; d: string; k: number }>;
  sim?: Array<{ s: string; n: string }>; bt?: Array<{ s: string; n: string; c: number }> }

export async function categoryView(db: D1Database, catId: number, page: number, sp: URLSearchParams, facet?: { fp: FacetPage; user: URLSearchParams }) {
  const [cat0, tree, fc, brands, imgs, cdRaw, lands] = await Promise.all([loadCategory(db, catId), catTree(db), facets(db, `f:${catId}`), brandList(db), catImages(db),
    siteCache(db, facet ? `cdata:f:${facet.fp.slug}` : `cdata:${catId}`),
    facet ? Promise.resolve([] as FacetPage[]) : db.prepare('SELECT * FROM facet_pages WHERE noindex = 0 AND total >= min_products AND base_slug = (SELECT slug FROM categories WHERE id = ?)').bind(catId).all<FacetPage>().then((r) => r.results).catch(() => [] as FacetPage[])]);
  if (!cat0) return null;
  const fp = facet?.fp;
  // "Oblíbené výběry": crawlable links to the landings of this category (price caps, brands, types). Landings used to be reachable only
  // through a filter click, so Google never found them (URL Inspection 4. 11. 2026: "Google adresu URL nezná").
  const picks = await db.prepare("SELECT slug, h1 FROM facet_pages WHERE noindex = 0 AND total >= min_products AND base_slug = ? AND slug <> ? ORDER BY volume DESC, total DESC LIMIT 14")
    .bind(cat0.slug, fp?.slug ?? '').all<{ slug: string; h1: string }>().then((r) => r.results).catch(() => [] as Array<{ slug: string; h1: string }>);
  // a facet shows its own texts instead of the category's; the icon and the tree position stay the base category's
  const cat = fp ? { ...cat0, name: fp.h1, seo_title: fp.seo_title, seo_desc: fp.seo_desc, description_html: fp.intro_html, second_html: fp.second_html, guide_html: '', faq_json: fp.faq_json, seo_robots: '' } : cat0;
  const f = parseFilters(sp);
  const filtered = fp ? isFiltered(parseFilters(facet!.user)) : isFiltered(f);
  // facet landings of this category: filter value → landing slug (the filter links lead to the clean URL)
  const landings: Record<string, string> = {};
  for (const l of lands) { const k = only(parseFilters(new URLSearchParams(l.qs))); if (k) landings[k] = l.slug; }
  // the plain filter of exactly one landing value → 301 to the landing (one indexable URL per combination)
  if (!fp && filtered && page === 1) {
    const one = only(f);
    if (one && landings[one]) return { redirect: `/${landings[one]}/` } as const;
  }
  const q = toListQuery(f, page, brands, fc);
  const { items, total } = await listProducts(db, { cat: cat.id }, q, fp ? undefined : cat.count_total);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  if (page > pages) return null;
  const chain = ancestry(tree, cat.id);
  // subcategory tiles: indexable categories with at least 3 products (merged clones are noindex), all of them
  const tile = (c: Cat) => c.count_total >= 3 && !c.noindex;
  let kids = (tree.kids.get(cat.id) ?? []).filter(tile);
  let kidsTitle = 'Podkategorie';
  if (!kids.length && cat.parent) {
    kids = (tree.kids.get(cat.parent) ?? []).filter((c) => tile(c) && c.id !== cat.id);
    kidsTitle = 'Související kategorie';
  }
  kids = kids.sort((a, b) => b.count_total - a.count_total);
  const base = fp ? `/${fp.slug}/` : `/${cat.slug}/`;
  const url = abs(pagePath(base, page));
  const title = categoryTitle(cat.name, cat.seo_title, page);
  const crumbs: Crumb[] = [{ name: 'Domů', url: '/' }, ...chain.map((c) => ({ name: decode(c.name), url: `/${c.slug}/` })), ...(fp ? [{ name: fp.h1, url: base }] : [])];
  // robots as on WordPress (live snapshot at the migration: thin categories outside the priority list are noindex),
  // plus an emptied category
  const noindex = fp ? fp.noindex === 1 || total < fp.min_products : cat.noindex === 1 || cat.seo_robots.includes('noindex') || cat.count_total === 0;
  let faq: Array<{ q: string; a: string }> = [];
  try { faq = page === 1 && cat.faq_json ? JSON.parse(cat.faq_json) : []; } catch { /* broken JSON = no FAQ */ }
  // live price data (nightly, kategorie-data.py): H1, lead paragraph, quick overview, dynamic description and FAQ answers with real numbers
  let cd: CData | null = null;
  try { cd = cdRaw ? JSON.parse(cdRaw) as CData : null; } catch { /* no data */ }
  const h1 = fp ? decode(fp.h1) : (H1[cat.slug] ?? decode(cat.name));
  const subtitle = !fp && H1[cat.slug] && H1[cat.slug] !== decode(cat.name) ? decode(cat.name) : '';
  // shops in the comparison: the same number as the homepage (all shops with an active offer); the category filter lists only the biggest few
  let shopsN = 0;
  try { shopsN = ((JSON.parse((await siteCache(db, 'home')) ?? '{}') as { shops?: Array<[string, number]> }).shops ?? []).length; } catch { /* no home cache */ }
  const kcs = (n: number) => `${cislo(n)} Kč`;
  const short = (t: string) => t.replace(/\s+/g, ' ').replace(/\s+\d[\d,.]*\s*(l|cl|ml)\b.*$/i, '').trim();
  let lead = '';
  if (cd && page === 1 && !filtered) {
    const c0 = cd.cheapest[0];
    lead = `<p class="lead"><strong>${h1}</strong>: porovnáváme ${cislo(cd.n)} ${produktu(cd.n)} z ${shopsN || '20+'} e-shopů. Ceny začínají na ${kcs(cd.lo)}, běžná cena je ${kcs(cd.med)} a většina nabídek stojí do ${kcs(cd.hi)}.`
      + (c0 ? ` Nejlevnější lahev: <a href="/${c0.s}/">${decode(short(c0.n))}</a> za ${kcs(c0.p)}${c0.d ? ' (' + shopName(c0.d) + ')' : ''}.` : '')
      + (cd.ppl_med ? ` Průměrná cena za litr je ${kcs(cd.ppl_med)}.` : '') + ` Ceny aktualizujeme každý den.</p>`;
    if (faq.length) faq = [
      { q: `Kolik stojí ${h1.toLowerCase()}?`, a: `Aktuálně od ${kcs(cd.lo)}. Běžná cena v našem srovnání je ${kcs(cd.med)}, většina nabídek je do ${kcs(cd.hi)}. Cena závisí na druhu, stáří a objemu lahve${cd.ppl_med ? `, orientačně vychází ${kcs(cd.ppl_med)} za litr` : ''}.` },
      ...(c0 ? [{ q: `Kde koupit ${h1.toLowerCase()} nejlevněji?`, a: `Nejnižší cenu najdete u každého produktu v přehledu obchodů seřazených podle ceny. Dnes je nejlevnější ${decode(short(c0.n))} za ${kcs(c0.p)}${c0.d ? ' v obchodě ' + shopName(c0.d) : ''}. Nakupujete přímo u e-shopu, my ceny jen porovnáváme.` }] : []),
      ...faq];
  }
  const artKw = ART[cat.slug];
  const articles = page === 1 && !filtered && artKw ? await db.prepare("SELECT slug, title FROM posts WHERE type = 'post' AND status = 'publish' AND slug LIKE ? ORDER BY published_at DESC LIMIT 4").bind(`%${artKw}%`).all<{ slug: string; title: string }>().then((r) => r.results).catch(() => [] as Array<{ slug: string; title: string }>) : [];
  const liveDesc = cd && !filtered ? clamp(`${h1}: ${cislo(cd.n)} ${produktu(cd.n)} od ${kcs(cd.lo)}${cd.cheapest[0] ? `, nejlevnější ${decode(short(cd.cheapest[0].n))} za ${kcs(cd.cheapest[0].p)}` : ''}. Porovnání cen z ${shopsN || '20+'} e-shopů, aktualizace denně.`, 158) : '';
  const meta: Meta = {
    title: shopsN >= 20 ? title.replace('20+', String(shopsN)) : title,
    description: liveDesc || descFrom(cat.seo_desc, cat.description_html, { term: decode(cat.name) },
      fc?.n ? `Porovnejte ceny ${cislo(fc.n)} produktů z kategorie ${decode(cat.name)} v ${fc.s.length} ověřených e-shopech.${fc.lo ? ` Nejlevněji od ${cislo(fc.lo)} Kč.` : ''}` : '', page),
    // filtered / re-sorted listings: noindex, follow and no canonical (the indexable listing is the plain URL)
    ...(noindex || filtered ? {} : { canonical: url }), robots: filtered ? ['noindex', 'follow'] : robots(noindex, cat.seo_robots),
    ...(page > 1 && !filtered ? { prev: abs(pagePath(base, page - 1)) } : {}),
    ...(page < pages && !filtered ? { next: abs(pagePath(base, page + 1)) } : {}),
    // Rank Math + ah-seo.php: the page node is a FAQPage when the category has its FAQ, breadcrumb and item list in the graph
    graph: [
      faq.length ? { ...collection(url, title), '@type': 'FAQPage', mainEntity: faq.map((x) => ({ '@type': 'Question', name: stripTags(x.q), acceptedAnswer: { '@type': 'Answer', text: stripTags(x.a) } })) } : collection(url, title),
      { ...breadcrumbLd(crumbs), '@context': undefined, '@id': BASE + '/#breadcrumb' },
      ...(items.length ? [{ ...itemListLd(abs(base), 'TOP ' + decode(cat.name), items.slice(0, 10))!, '@context': undefined }] : []),
    ],
    jsonLd: [], shortOrg: true,
  };
  // gift categories link the seasonal guides (mu-plugin v2.6: Q4 corporate orders)
  const gift = ['darkove-boxy', 'darkove-baleni', 'darkova-baleni-alkoholu', 'darky-z-alkohol-cz', 'darkove-sady-na-vyrobu-alkoholu'].includes(cat.slug) && page === 1;
  return {
    meta, cat, crumbs, items, total, page, pages, base, f, qs: toQuery(fp ? parseFilters(facet!.user) : f), kids, kidsTitle, tree, fc, brands, imgs, landings, faq, gift, picks, h1, subtitle, lead, cd, articles, shopsN,
    guide: page === 1 && !filtered ? cat.guide_html : '',
    isFiltered: filtered,
  };
}

/** `key=value` when the filter state is a single brand or a single parameter value and nothing else, else null. */
function only(f: ReturnType<typeof parseFilters>): string | null {
  if (f.sort !== 'pop' || f.min !== undefined || f.max !== undefined || f.obchod.length || f.skladem || f.kat) return null;
  if (f.sleva) return f.znacka.length || Object.keys(f.p).length ? null : 'sleva=1';
  const ps = Object.entries(f.p);
  if (f.znacka.length === 1 && !ps.length) return `brand=${f.znacka[0]}`;
  if (!f.znacka.length && ps.length === 1 && ps[0]![1]!.length === 1) return `${ps[0]![0]}=${ps[0]![1]![0]}`;
  return null;
}

// ---------- brand ----------
/** Brand pages that are really SHOPS (Lihovárek, Warehouse #1, Alkohol.cz …): people search the shop name; the page shows the shop's bestsellers with buy links. */
const SHOP_BRAND: Record<string, string> = {
  'lihovarek-cz': 'lihovarek.cz', 'warehouse-1': 'warehouse1.cz', 'alkohol-cz': 'alkohol.cz', 'drinkcentrum-cz': 'drinkcentrum.cz', 'topalkohol-cz': 'topalkohol.cz', 'svetnapoju-cz': 'svetnapoju.cz',
  'vinisto-cz': 'vinisto.cz', 'vinokral-cz': 'vinokral.cz', 'barman-cz': 'barman.cz', 'dramroom-cz': 'dramroom.cz', 'destilerka-cz': 'destilerka.cz', 'donpealo-cz': 'donpealo.cz',
  'wineplanet-cz': 'wineplanet.cz', 'simplywines-cz': 'simplywines.cz', 'ocenenavina-cz': 'ocenenavina.cz', 'osobnivinoteka-cz': 'osobnivinoteka.cz', 'panalfred-cz': 'panalfred.cz',
};
export async function brandView(db: D1Database, slug: string, page: number, sp: URLSearchParams) {
  const [b, tree, brands] = await Promise.all([loadBrand(db, slug), catTree(db), brandList(db)]);
  if (!b) return null;
  const [fc, cdRaw, homeRaw] = await Promise.all([facets(db, `fb:${b.id}`), siteCache(db, `cdata:b:${b.id}`), siteCache(db, 'home')]);
  const f = parseFilters(sp);
  f.znacka = [];
  const filtered = isFiltered(f);
  const q = toListQuery(f, page, brands, fc, tree);
  const { items, total } = await listProducts(db, { brand: b.id }, q, b.count);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  if (page > pages && page > 1) return null;
  const base = `/znacka/${b.slug}/`;
  const url = abs(pagePath(base, page));
  // page 2+ kept Rank Math's plain term title on WordPress (the mu-plugin template only ran on page 1)
  const title = page > 1 ? termTitle(b.name, page) : (b.seo_title ? rmTitle(b.seo_title, decode(b.name)) : brandSeo(b).title);
  // WordPress indexed every brand with a product (Rank Math default); the sitemap lists those with ≥ 3
  const thin = b.noindex === 1 || b.count < 1;
  const crumbs: Crumb[] = [{ name: 'Domů', url: '/' }, { name: decode(b.name), url: base }];
  let faq: Array<{ q: string; a: string }> = [];
  try { faq = page === 1 && b.faq_json ? JSON.parse(b.faq_json) : []; } catch { /* broken JSON = no FAQ */ }
  // live price data (nightly, kategorie-data.py): lead, quick overview, "cena" in the title (Jägermeister cena 610/month, Becherovka cena 390 ...), FAQ answers with numbers
  let cd: CData & { cats?: Array<{ s: string; n: string; c: number }> } | null = null;
  try { cd = cdRaw ? JSON.parse(cdRaw) : null; } catch { /* no data */ }
  let shopsN = 0;
  try { shopsN = ((JSON.parse(homeRaw ?? '{}') as { shops?: Array<[string, number]> }).shops ?? []).length; } catch { /* no home cache */ }
  const bn = decode(b.name);
  const kcs = (n: number) => `${cislo(n)} Kč`;
  const short = (t: string) => t.replace(/\s+/g, ' ').replace(/\s+\d[\d,.]*\s*(l|cl|ml)\b.*$/i, '').trim();
  let lead = ''; let dynTitle = ''; let dynDesc = '';
  if (cd && page === 1 && !filtered) {
    const c0 = cd.cheapest[0];
    const cats = (cd.cats ?? []).filter((c) => c.s !== 'ostatni').slice(0, 4);
    lead = `<p class="lead"><strong>${bn}</strong>: porovnáváme ${cislo(cd.n)} ${produktu(cd.n)} z ${shopsN || '20+'} e-shopů, ceny od ${kcs(cd.lo)} (běžná cena ${kcs(cd.med)}).`
      + (c0 ? ` Nejlevnější: <a href="/${c0.s}/">${decode(short(c0.n))}</a> za ${kcs(c0.p)}${c0.d ? ' (' + shopName(c0.d) + ')' : ''}.` : '')
      + (cats.length ? ` Najdete je v kategoriích ${cats.map((c, i) => `${i ? ', ' : ''}<a href="/${c.s}/">${decode(c.n).toLowerCase()}</a> (${c.c})`).join('')}.` : '') + ` Ceny aktualizujeme každý den.</p>`;
    // "Bumbu rum", "Absolut vodka": people search brand + type; the type comes from the main category. The price in the title is the cheapest regular bottle
    // (cd.cheapest skips miniatures), not the 0,05 l miniature (Baileys "od 65 Kč" vs. 336 Kč for 0,7 l).
    const TYPE: Record<string, string> = { 'rumy-a-ochucene-rumy': 'rum', 'tmave-rumy': 'rum', 'bile-rumy': 'rum', 'korenene-rumy': 'rum', 'vodky-a-ochucene-vodky': 'vodka', 'giny': 'gin', 'whisky-a-ochucene-whisky': 'whisky',
      'skotske-whisky': 'whisky', 'americke-whiskey': 'whiskey', 'irske-whiskey': 'whiskey', 'tequily': 'tequila', 'konaky': 'koňak', 'piva': 'pivo', 'pivo': 'pivo' };
    const typeWord = cats[0] ? TYPE[cats[0].s] ?? '' : '';
    const bnT = typeWord && !bn.toLowerCase().includes(typeWord) ? `${bn} ${typeWord}` : bn;
    const from = c0 ? c0.p : cd.lo;
    const sale = (cd.deals ?? []).reduce((m, d) => Math.max(m, d.x), 0);
    const saleTxt = sale >= 10 ? ` – sleva až ${Math.round(sale)} %` : '';
    dynTitle = [`${bnT} cena od ${kcs(from)}${saleTxt} | Alkoholický`, `${bnT} cena od ${kcs(from)} – všechny druhy | Alkoholický`, `${bnT} cena od ${kcs(from)} | Alkoholický`, `${bnT} cena | Alkoholický`, `${bn} cena | Alkoholický`].find((t) => t.length <= 62) ?? '';
    dynDesc = clamp(`${bnT}: ${cislo(cd.n)} ${produktu(cd.n)} od ${kcs(from)}${sale >= 10 ? `, sleva až ${Math.round(sale)} %` : ''}${c0 ? `, nejlevnější ${decode(short(c0.n))} za ${kcs(c0.p)}` : ''}. Porovnání cen z ${shopsN || '20+'} e-shopů, aktualizace denně.`, 158);
    // alcohol strength from the product names ("… 0,7l 40%"): answers "kolik procent alkoholu má {značka}" (a "People also ask" question for brand searches)
    const abvs = (items as Array<{ name?: string }>).map((i) => Number((/(\d{1,2}(?:[.,]\d)?)\s*%/.exec(decode(i.name ?? ''))?.[1] ?? '0').replace(',', '.'))).filter((x) => x >= 1 && x <= 96);
    const abvFaq = abvs.length >= 3 ? (() => {
      const lo = Math.min(...abvs), hi = Math.max(...abvs); const freq = new Map<number, number>(); abvs.forEach((x) => freq.set(x, (freq.get(x) ?? 0) + 1));
      const mode = [...freq.entries()].sort((a, c) => c[1] - a[1])[0]![0]; const f1 = (x: number) => String(x).replace('.', ',');
      return { q: `Kolik procent alkoholu má ${bn}?`, a: lo === hi ? `Produkty ${bn} v našem srovnání mají ${f1(lo)} % alkoholu.` : `Nejčastěji ${f1(mode)} %, podle druhu od ${f1(lo)} do ${f1(hi)} %. Přesná síla je vždy v názvu a popisu konkrétní lahve.` };
    })() : null;
    if (faq.length || cd.n >= 3) faq = [
      { q: `Kolik stojí ${bn}?`, a: `Ceny ${bn} začínají na ${kcs(cd.lo)}, běžná cena v našem srovnání je ${kcs(cd.med)}${cd.ppl_med ? ` (orientačně ${kcs(cd.ppl_med)} za litr)` : ''}. Konkrétní cena závisí na druhu, objemu a balení.` },
      ...(abvFaq ? [abvFaq] : []),
      ...(c0 ? [{ q: `Kde koupit ${bn} nejlevněji?`, a: `Dnes je nejlevnější ${decode(short(c0.n))} za ${kcs(c0.p)}${c0.d ? ' v obchodě ' + shopName(c0.d) : ''}. U každého produktu vidíte všechny obchody seřazené podle ceny; nakupujete přímo u e-shopu, my ceny jen porovnáváme.` }] : []),
      ...faq];
  }
  const shopDomain = SHOP_BRAND[b.slug] ?? '';
  const shopOffers = shopDomain && page === 1 && !filtered ? await db.prepare("SELECT o.go_slug, o.price, p.slug, p.name FROM offers o JOIN products p ON p.id = o.product_id WHERE o.domain = ? AND o.active = 1 AND p.status = 'publish' ORDER BY p.pop DESC LIMIT 8")
    .bind(shopDomain).all<{ go_slug: string; price: number; slug: string; name: string }>().then((r) => r.results).catch(() => [] as Array<{ go_slug: string; price: number; slug: string; name: string }>) : [];
  const meta: Meta = {
    title: b.slug === 'karloff-tatratea-tatransky-caj' && cd && page === 1 && !filtered ? `Tatranský čaj cena od ${kcs(cd.cheapest[0]?.p ?? cd.lo)} – druhy 17–72 % | Alkoholický` : dynTitle && b.slug !== 'karloff-tatratea-tatransky-caj' ? dynTitle : title,
    description: dynDesc && !b.seo_desc ? dynDesc : descFrom(b.seo_desc, '', {}, brandSeo(b).desc, page),
    ...(thin || filtered ? {} : { canonical: url }), robots: filtered ? ['noindex', 'follow'] : robots(thin),
    ...(page > 1 && !filtered ? { prev: abs(pagePath(base, page - 1)) } : {}),
    ...(page < pages && !filtered ? { next: abs(pagePath(base, page + 1)) } : {}),
    graph: [faq.length ? { ...collection(url, title), '@type': 'FAQPage', mainEntity: faq.map((x) => ({ '@type': 'Question', name: stripTags(x.q), acceptedAnswer: { '@type': 'Answer', text: stripTags(x.a) } })) } : collection(url, title)],
    jsonLd: [breadcrumbLd(crumbs), itemListLd(abs(base), decode(b.name), items)].filter(Boolean),
  };
  return { meta, faq, lead, cd, shopsN, shopDomain, shopOffers, brand: b, crumbs, items, total, page, pages, base, f, qs: toQuery(f), tree, fc, brands, isFiltered: filtered };
}

/** mu-plugin ah_claude_brand_seo (v2.0): title/description of brands without their own Rank Math texts. */
function brandSeo(b: { slug: string; name: string; count: number }): { title: string; desc: string } {
  const year = new Date().getFullYear();
  if (b.slug === 'karloff-tatratea-tatransky-caj') {
    return { title: `Tatranský čaj (Tatratea) — všechny druhy a ceny ${year} | Alkoholický`, desc: 'Tatranský čaj Karloff Tatratea: všechny druhy od 17 do 72 % i mini sety a dárková balení. Porovnejte ceny e-shopů a kupte nejlevněji.' };
  }
  const name = decode(b.name).replace(/\s*[–-]\s*/g, ' ').trim();
  const n = b.count;
  return {
    title: `${name} — ceny a nejlevnější nabídky ${year} | Alkoholický`,
    desc: `${name}: ${n} ${n >= 5 ? 'produktů' : n >= 2 ? 'produkty' : 'produkt'} na jednom místě. Porovnejte ceny e-shopů a kupte nejlevněji — nabídky aktualizujeme denně.`,
  };
}

// ---------- search ----------
export async function searchView(db: D1Database, query: string, page: number) {
  const [tree, brands] = await Promise.all([catTree(db), brandList(db)]);
  const { items, total } = await searchProducts(db, query, page);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const meta: Meta = { title: searchTitle(query, page, pages), description: '', robots: ['follow', 'noindex'], graph: [], jsonLd: [] };
  const { cats, brs } = matchNames(query, tree, brands);
  return { meta, query, items, total, page, pages, tree, cats, brs };
}

/** Categories and brands whose name contains every typed word (diacritics-insensitive) — search page + suggestions. */
export function matchNames(query: string, tree: Awaited<ReturnType<typeof catTree>>, brands: Awaited<ReturnType<typeof brandList>>) {
  const fold = (t: string) => decode(t).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const words = fold(query).split(/[^a-z0-9]+/).filter((w) => w.length > 1);
  if (!words.length) return { cats: [] as Cat[], brs: [] as Array<{ slug: string; name: string; count: number }> };
  const hit = (name: string) => { const n = fold(name); return words.every((w) => n.includes(w)); };
  const cats = [...tree.byId.values()].filter((c) => c.count_total > 0 && !c.noindex && hit(c.name)).sort((a, b) => b.count_total - a.count_total).slice(0, 6);
  const brs = [...brands.byId.values()].filter((b) => b.slug !== 'ostatni' && hit(b.name)).sort((a, b) => b.count - a.count).slice(0, 6);
  return { cats, brs };
}

// ---------- product ----------
export async function productView(db: D1Database, id: number) {
  const [data, tree] = await Promise.all([loadProduct(db, id), catTree(db)]);
  if (!data) return null;
  const { product: p, offers, catIds, history, brand, params } = data;
  const name = decode(p.name);
  // breadcrumb/category: a noindex category (e.g. "Ostatní") only when the product has no other
  const cats = [p.primary_cat, ...catIds].map((i) => tree.byId.get(i)).filter((c): c is Cat => !!c);
  const primary = cats.find((c) => !c.noindex) ?? cats[0];
  const chain = primary ? ancestry(tree, primary.id) : [];
  const url = abs(`/${p.slug}/`);
  // live price in the snippet: "Jack Daniel's 0,7 l od 499 Kč | 9 obchodů" (the old "Kde koupit nejlevněji? (2026)" says nothing a competitor's title does not)
  const liveMin = offers.length ? Math.min(...offers.map((o) => o.price)) : 0;
  const liveShops = new Set(offers.map((o) => o.domain)).size;
  const dynTitle = liveMin > 0 ? `${decode(p.name)} od ${cislo(Math.round(liveMin))} Kč | ${liveShops} ${liveShops === 1 ? 'obchod' : liveShops < 5 ? 'obchody' : 'obchodů'}` : '';
  const title = !p.seo_title && dynTitle && dynTitle.length <= 66 ? dynTitle : productTitle(p.name, p.seo_title);
  // seo_desc = Rank Math description or the raw (untexturized) short description from the migration
  const prices0 = offers.map((o) => o.price);
  const l0 = /(\d(?:[.,]\d+)?)\s*l\b/i.exec(name); const lit = l0 ? Number(l0[1]!.replace(',', '.')) : 0;
  const cheapest = offers.find((o) => o.price === liveMin);
  const liveDesc = offers.length ? clamp(`${name}: nejnižší cena ${cislo(Math.round(liveMin))} Kč${cheapest ? ' v ' + shopName(cheapest.domain) : ''}, porovnáno ${liveShops} ${liveShops === 1 ? 'obchod' : liveShops < 5 ? 'obchody' : 'obchodů'}${lit >= 0.3 && lit <= 5 ? `, ${cislo(Math.round(liveMin / lit))} Kč za litr` : ''}. Ceny aktualizujeme denně.`, 158) : '';
  const description = (!p.seo_desc && liveDesc) || descFrom(p.seo_desc, p.short_html, { title: name, clamp: true },
    offers.length ? `${name} – porovnejte ceny v ${new Set(offers.map((o) => o.domain)).size} obchodech, nejlevněji od ${cislo(Math.min(...prices0))} Kč.` : '');
  // without any offer the page is thin and a Product snippet without offers is invalid → noindex, no Product node
  const noindex = p.noindex === 1 || offers.length === 0;
  const inStock = offers.filter((o) => o.stock !== -1);
  const best: Offer | undefined = (inStock.length ? inStock : offers)[0];
  const prices = offers.map((o) => o.price);
  const stats = { n: offers.length, shops: new Set(offers.map((o) => o.domain)).size, min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 };
  const img = validImage(p.image);
  const crumbs: Crumb[] = [{ name: 'Domů', url: '/' }, ...chain.map((c) => ({ name: decode(c.name), url: `/${c.slug}/` })), { name, url: `/${p.slug}/` }];
  const skip = new Set(['ostatni', 'nezarazene', 'uncategorized']);
  const relCats = catIds.map((cid) => tree.byId.get(cid)).filter((c): c is Cat => !!c && !skip.has(c.slug)).slice(0, 6);
  const related = await relatedProducts(db, primary?.id ?? 0, p.id, p.min_price || 0);
  let gallery: string[] = [];
  try { gallery = p.images ? (JSON.parse(p.images) as string[]).map(validImage).filter(Boolean) : []; } catch { /* no gallery */ }
  // data blocks (no feed text): price per litre against the category median, FAQ from the numbers, more of the same brand, a paragraph from the parameters
  const cdp = offers.length && primary ? await siteCache(db, `cdata:${primary.id}`).then((r) => { try { return r ? JSON.parse(r) as CData : null; } catch { return null; } }) : null;
  const ppl = lit >= 0.3 && lit <= 5 && liveMin > 0 ? Math.round(liveMin / lit) : 0;
  const vsMed = cdp && cdp.med > 0 && liveMin > 0 ? Math.round((1 - liveMin / cdp.med) * 100) : 0;
  const abvP = (params.alkohol ?? [])[0]; const volP = (params.objem ?? [])[0]; const zemeP = (params.zeme ?? [])[0];
  const brandName = brand && brand.slug !== 'ostatni' ? decode(brand.name) : '';
  const shortFeed = stripTags(p.desc_html ?? '').length < 300;
  const autoText = offers.length && shortFeed && primary
    ? `${name} je ${decode(primary.name).toLowerCase()}${brandName ? ' značky ' + brandName : ''}${abvP ? ', obsah alkoholu ' + String(abvP).replace('.', ',') + ' %' : ''}${volP ? ', objem ' + String(volP).replace('.', ',') + ' l' : ''}${zemeP ? ', země původu ' + zemeP : ''}. `
      + `V našem srovnání ji nabízí ${liveShops} ${liveShops === 1 ? 'obchod' : liveShops < 5 ? 'obchody' : 'obchodů'}${ppl ? `, cena vychází na ${cislo(ppl)} Kč za litr` : ''}${Math.abs(vsMed) >= 8 ? `, což je o ${Math.abs(vsMed)} % ${vsMed > 0 ? 'méně' : 'více'} než běžná cena v kategorii` : ''}.`
    : '';
  const faq: Array<{ q: string; a: string }> = offers.length ? [
    { q: `Kolik stojí ${name}?`, a: `Nejnižší cena je ${cislo(Math.round(liveMin))} Kč${cheapest ? ' v obchodě ' + shopName(cheapest.domain) : ''}${stats.n > 1 ? `, nejvyšší ${cislo(Math.round(stats.max))} Kč (porovnáno ${stats.n} nabídek)` : ''}. Ceny aktualizujeme každý den.` },
    { q: `Kde koupit ${name} nejlevněji?`, a: `${cheapest ? `Dnes nejlevněji v obchodě ${shopName(cheapest.domain)} za ${cislo(Math.round(liveMin))} Kč. ` : ''}Všechny obchody seřazené podle ceny najdete v přehledu nahoře; nakupujete přímo u e-shopu, cena je stejná.` },
    ...(ppl ? [{ q: `Kolik stojí ${name} za litr?`, a: `Při nejnižší ceně vychází ${cislo(ppl)} Kč za litr${cdp?.ppl_med ? `, běžná cena za litr v kategorii je ${cislo(cdp.ppl_med)} Kč` : ''}.` }] : []),
    ...(abvP ? [{ q: `Kolik procent alkoholu má ${name}?`, a: `Obsah alkoholu je ${String(abvP).replace('.', ',')} % podle parametrů produktu. Pro přepočet na konkrétní porci použijte naši kalkulačku alkoholu.` }] : []),
  ] : [];
  const brandMore = brand && brand.slug !== 'ostatni' && offers.length ? await db.prepare("SELECT p2.id FROM brand_products bp JOIN products p2 ON p2.id = bp.product_id WHERE bp.brand_id = ? AND p2.id <> ? AND p2.status = 'publish' AND p2.offer_count > 0 ORDER BY p2.pop DESC LIMIT 6")
    .bind(brand.id, p.id).all<{ id: number }>().then((r) => cardsByIds(db, r.results.map((x) => x.id))).catch(() => [] as Card[]) : [] as Card[];
  const graph: unknown[] = [
    ...(img ? [{ '@type': 'ImageObject', '@id': img, url: img, inLanguage: 'cs' }] : []),
    ...(faq.length >= 3 ? [{ '@type': 'FAQPage', '@id': url + '#faq', url, mainEntity: faq.map((x) => ({ '@type': 'Question', name: x.q, acceptedAnswer: { '@type': 'Answer', text: x.a } })) }] : []),
    { '@type': 'ItemPage', '@id': url + '#webpage', url, name: title, datePublished: isoPrague(p.created_at), dateModified: isoPrague(p.updated_at), isPartOf: { '@id': BASE + '/#website' }, ...(img ? { primaryImageOfPage: { '@id': img } } : {}), inLanguage: 'cs' },
    ...(offers.length ? [{
      '@type': 'Product', '@id': url + '#richSnippet', name, description, sku: String(p.id),
      ...(brand && brand.slug !== 'ostatni' ? { brand: { '@type': 'Brand', name: decode(brand.name) } } : {}),
      ...(primary ? { category: decode(primary.name) } : {}),
      mainEntityOfPage: { '@id': url + '#webpage' },
      ...(p.ean ? { gtin: p.ean } : {}),
      ...(img ? { image: [{ '@type': 'ImageObject', url: img }] } : {}),
      // price comparison: one AggregateOffer over all shops (lowPrice/highPrice/offerCount)
      ...(best ? {
        offers: {
          '@type': 'AggregateOffer', priceCurrency: 'CZK', lowPrice: String(Math.round(stats.min)), highPrice: String(Math.round(stats.max)), offerCount: String(stats.n),
          availability: inStock.length ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', itemCondition: 'https://schema.org/NewCondition', url,
          // Rank Math filter on WordPress: Google warns about offers without it; prices are refreshed nightly
          priceValidUntil: new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10),
        },
      } : {}),
    }] : []),
  ];
  const meta: Meta = {
    title, description, ...(noindex ? {} : { canonical: url }), robots: robots(noindex), ogType: 'product', ogImage: img || OG_DEFAULT, graph,
    jsonLd: [breadcrumbLd(crumbs)],
    extraMeta: [
      { property: 'og:updated_time', content: isoPrague(p.updated_at) },
      ...(best ? [{ property: 'product:price:amount', content: String(Math.round(best.price)) }, { property: 'product:price:currency', content: 'CZK' }, { property: 'product:availability', content: best.stock === -1 ? 'out of stock' : 'instock' }] : []),
    ],
  };
  // mu-plugin C2: context line links the first category with ≥ 3 products
  const ctxCat = catIds.map((cid) => tree.byId.get(cid)).find((c): c is Cat => !!c && c.count_direct >= 3) ?? null;
  return { meta, p, name, offers, best, stats, history, brand, primary, crumbs, relCats, related, tree, img, gallery, params, ctxCat, autoText, faq, brandMore, brandName, ppl };
}

/** Split the product description at the empty Content Egg headings ("Kde koupit … nejlevněji", "Vývoj ceny …"):
 *  their blocks (offer table, price chart) are rendered by the template in the same place. */
export function splitDescription(html: string): { before: string; offersHeading: string; middle: string; historyHeading: string; after: string } {
  const re = (w: string) => new RegExp(`<h3[^>]*>\\s*${w}[^<]*</h3>`, 'i');
  let s = html;
  const mo = re('Kde koupit').exec(s);
  const out = { before: s, offersHeading: '', middle: '', historyHeading: '', after: '' };
  if (mo) {
    out.before = s.slice(0, mo.index);
    out.offersHeading = mo[0];
    s = s.slice(mo.index + mo[0].length);
    out.middle = s;
  }
  const mh = re('Vývoj ceny').exec(mo ? out.middle : out.before);
  if (mh) {
    const src = mo ? out.middle : out.before;
    const head = src.slice(0, mh.index);
    if (mo) out.middle = head; else out.before = head;
    out.historyHeading = mh[0];
    out.after = src.slice(mh.index + mh[0].length);
  }
  return out;
}

// ---------- posts / pages ----------
export async function postView(db: D1Database, id: number) {
  const post = await loadPost(db, id);
  if (!post) return null;
  const url = abs(`/${post.slug}/`);
  const title = postTitle(post.title, post.seo_title);
  const description = descFrom(post.seo_desc, post.excerpt || post.content_html, { title: decode(post.title) });
  const img = post.image;
  // JSON-LD exactly as WordPress printed it (live snapshot at the migration: Rank Math + mu-plugin FAQPage/Recipe/
  // WebApplication/E-E-A-T nodes); built here only for posts written after the migration
  let live: { graph: unknown[]; extra: unknown[] } | null = null;
  try { live = post.ld_json ? JSON.parse(post.ld_json) : null; } catch { live = null; }
  if (post.type === 'page') {
    const meta: Meta = {
      title, description, ...(post.noindex ? {} : { canonical: url }), robots: robots(post.noindex === 1, post.seo_robots), ogImage: img || OG_DEFAULT,
      graph: live?.graph ?? [{ '@type': 'WebPage', '@id': url + '#webpage', url, name: title, datePublished: isoPrague(post.published_at), dateModified: isoPrague(post.modified_at), isPartOf: { '@id': BASE + '/#website' }, inLanguage: 'cs' }],
      jsonLd: live?.extra ?? [],
    };
    return { meta, post, cat: null, related: [] as PostCard[], comments: [], shopCats: [] as Cat[] };
  }
  const [cat, latest, coms] = await Promise.all([postCat(db, post.cat_id), relatedPosts(db, post, 4), comments(db, post.id)]);
  const related = latest.slice(0, 4);
  const name = post.author || 'Alkoholický.cz';
  const author = { '@type': 'Person', '@id': url + '#author', name, worksFor: { '@id': BASE + '/#organization' } };
  const built: unknown[] = [
    ...(img ? [{ '@type': 'ImageObject', '@id': img, url: img, ...(post.image_w ? { width: String(post.image_w), height: String(post.image_h) } : {}), ...(post.image_alt ? { caption: post.image_alt } : {}), inLanguage: 'cs' }] : []),
    { '@type': 'WebPage', '@id': url + '#webpage', url, name: title, datePublished: isoPrague(post.published_at), dateModified: isoPrague(post.modified_at), isPartOf: { '@id': BASE + '/#website' }, ...(img ? { primaryImageOfPage: { '@id': img } } : {}), inLanguage: 'cs' },
    author,
    {
      '@type': 'BlogPosting', headline: title, description, datePublished: isoPrague(post.published_at), dateModified: isoPrague(post.modified_at),
      author: { '@id': author['@id'], name }, publisher: { '@id': BASE + '/#organization' }, ...(img ? { image: { '@id': img } } : {}),
      inLanguage: 'cs', '@id': url + '#richSnippet', isPartOf: { '@id': url + '#webpage' }, mainEntityOfPage: { '@id': url + '#webpage' },
    },
    breadcrumbLd([{ name: 'Domů', url: '/' }, { name: 'Magazín', url: '/blog/' }, { name: decode(post.title), url: `/${post.slug}/` }]),
  ];
  const graph = live?.graph ?? built;
  const meta: Meta = {
    title, description, ...(post.noindex ? {} : { canonical: url }), robots: robots(post.noindex === 1, post.seo_robots), ogImage: img || OG_DEFAULT, graph, jsonLd: live?.extra ?? [],
    extraMeta: [{ property: 'article:published_time', content: isoPrague(post.published_at) }, { property: 'article:modified_time', content: isoPrague(post.modified_at) }],
  };
  return { meta, post, cat, related, comments: coms, shopCats: [] as Cat[] };
}

export async function blogView(db: D1Database, page: number, catId?: number) {
  const { items, total } = await listPosts(db, page, catId);
  const pages = Math.max(1, Math.ceil(total / POSTS_PER_PAGE));
  if (page > pages && page > 1) return null;
  const cat = catId ? await postCat(db, catId) : null;
  const base = cat ? `/${cat.slug}/` : '/blog/';
  const url = abs(pagePath(base, page));
  // titles/descriptions of the live site (snapshot, src/data/postcat-seo.json)
  const seo = (postcatSeo as Record<string, { title: string; desc: string; h1: string }>)[cat ? cat.slug : 'blog'];
  const title = seo?.title ? paged(seo.title, page) : termTitle(cat ? cat.name : 'Magazín o alkoholu', page);
  const meta: Meta = {
    title, description: descFrom(seo?.desc ?? '', cat ? cat.description : '', {}, cat ? `Články z rubriky ${decode(cat.name)} v magazínu Alkoholický.cz.` : 'Magazín Alkoholický.cz: recenze alkoholu, nákupní rádce a tipy na dárky.', page),
    canonical: url, robots: robots(false),
    ...(page > 1 ? { prev: abs(pagePath(base, page - 1)) } : {}),
    ...(page < pages ? { next: abs(pagePath(base, page + 1)) } : {}),
    graph: [collection(url, title)], jsonLd: [],
  };
  return { meta, items, total, page, pages, base, cat, h1: seo?.h1 ?? '' };
}

export interface HomeBlocks { deals: number[]; popular: number[]; brands: Array<[number, number]>; shops: Array<[string, number]>; products: number; offers: number }
export async function homeView(db: D1Database) {
  const [tree, brands, imgs, raw, mag] = await Promise.all([catTree(db), brandList(db), catImages(db), siteCache(db, 'home'), latestPosts(db, 4)]);
  let home: HomeBlocks = { deals: [], popular: [], brands: [], shops: [], products: 0, offers: 0 };
  try { if (raw) home = JSON.parse(raw) as HomeBlocks; } catch { /* nightly block missing */ }
  const cards = await cardsByIds(db, [...home.deals, ...home.popular]);
  const by = new Map(cards.map((c) => [c.id, c]));
  const pick = (ids: number[]) => ids.map((i) => by.get(i)).filter((x): x is Card => !!x);
  return { tree, brands, imgs, home, deals: pick(home.deals), popular: pick(home.popular), mag };
}

export type { Card, Cat, Post, PostCard };
