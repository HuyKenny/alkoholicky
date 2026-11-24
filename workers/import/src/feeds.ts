// Partner feeds of alkoholicky.cz (former Content Egg modules Feed__1 … Feed__20, 27. 10. 2026). Feed URLs carry tokens →
// secrets FEED_URL_<n> (scripts/set-feed-secrets.py reads credentials/.alkoholicky-feeds.json). Deeplink prefixes and tracking
// parameters are public (they are in every outgoing link) and live here.
// Link rule = Content Egg: deeplink ? deeplink + encodeURIComponent(product URL) : product URL + tracking params.
export interface FeedDef {
  id: number;            // n of Feed__n (offers.feed = 'Feed__n')
  name: string;
  domain: string;
  format: 'google' | 'heureka';
  deeplink: string;
  tracking: string;
  /** false = feed not imported and its offers hidden (finalizeDay). Re-enable = set true + deploy. */
  enabled?: boolean;
  /** items whose feed CATEGORYTEXT matches are not imported (e.g. food); their existing offers go inactive like any item that left the feed */
  skipCategory?: (categoryText: string) => boolean;
}

export const FEEDS: FeedDef[] = [
  { id: 1, name: 'Alkohol.cz', domain: 'alkohol.cz', format: 'heureka', deeplink: '', tracking: 'a_box=nv54ekpw' },
  { id: 2, name: 'DrinkCentrum', domain: 'drinkcentrum.cz', format: 'heureka', deeplink: 'https://login.affial.com/scripts/8m338kc?a_aid=637035ea64181&a_bid=85cce787&desturl=', tracking: '' },
  { id: 3, name: 'Svět nápojů', domain: 'svetnapoju.cz', format: 'heureka', deeplink: 'https://ehub.cz/system/scripts/click.php?a_aid=052443b7&a_bid=6aa48880&desturl=', tracking: '' },
  { id: 4, name: 'Topalkohol', domain: 'topalkohol.cz', format: 'heureka', deeplink: 'https://ehub.cz/system/scripts/click.php?a_aid=052443b7&a_bid=3e59749f&desturl=', tracking: '' },
  { id: 5, name: 'Vinisto', domain: 'vinisto.cz', format: 'heureka', deeplink: 'https://ehub.cz/system/scripts/click.php?a_aid=052443b7&a_bid=bcd94e84&desturl=', tracking: '',
    // Kenny 25. 11. 2026: only alcohol, beer and soft drinks (+ coffee): no food, cosmetics, glasses, bags, T-shirts, tastings
    skipCategory: (c) => { const t = new Set(c.split('|').map((x) => x.trim())); return !t.has('Alkoholické nápoje') && ['Potraviny a delikatesy', 'Sety potravin a delikates', 'Kosmetika a osobní péče', 'Doplňky k vínu', 'Sklenice na víno', 'Tašky v akci', 'Degustace vína v Praze', 'Domácnost a kuchyně'].some((x) => t.has(x)); } },
  { id: 7, name: 'Vínokrál', domain: 'vinokral.cz', format: 'heureka', deeplink: 'https://ehub.cz/system/scripts/click.php?a_aid=052443b7&a_bid=62cbd446&desturl=', tracking: '' },
  { id: 8, name: 'Barman', domain: 'barman.cz', format: 'heureka', deeplink: 'https://ehub.cz/system/scripts/click.php?a_aid=052443b7&a_bid=6caa871c&desturl=', tracking: '' },
  { id: 9, name: 'Oceněná vína', domain: 'ocenenavina.cz', format: 'heureka', deeplink: 'https://ehub.cz/system/scripts/click.php?a_aid=052443b7&a_bid=c887d0ca&desturl=', tracking: '' },
  { id: 10, name: 'Warehouse #1', domain: 'warehouse1.cz', format: 'heureka', deeplink: 'https://ehub.cz/system/scripts/click.php?a_aid=052443b7&a_bid=09dc7e5b&desturl=', tracking: '' },
  { id: 11, name: 'DramRoom', domain: 'dramroom.cz', format: 'heureka', deeplink: 'https://ehub.cz/system/scripts/click.php?a_aid=052443b7&a_bid=518117bc&desturl=', tracking: '' },
  { id: 12, name: 'Lihovárek', domain: 'lihovarek.cz', format: 'heureka', deeplink: 'https://ehub.cz/system/scripts/click.php?a_aid=052443b7&a_bid=8dab2dd7&desturl=', tracking: '' },
  { id: 13, name: 'Osobní vinotéka', domain: 'osobnivinoteka.cz', format: 'heureka', deeplink: 'https://ehub.cz/system/scripts/click.php?a_aid=052443b7&a_bid=73bd1fa4&desturl=', tracking: '' },
  // Affiliateport (scaletrk): the feed already carries the click URL (HTML-escaped "&amp;")
  { id: 14, name: 'Pan Alfred', domain: 'panalfred.cz', format: 'heureka', deeplink: '', tracking: '' },
  { id: 15, name: 'Wineplanet', domain: 'wineplanet.cz', format: 'heureka', deeplink: '', tracking: '' },
  { id: 16, name: 'SimplyWines', domain: 'simplywines.cz', format: 'google', deeplink: 'https://go.dognet.com/?chid=Gcxudbrq&url=', tracking: '' },
  { id: 17, name: 'Don Pealo', domain: 'donpealo.cz', format: 'heureka', deeplink: 'https://ehub.cz/system/scripts/click.php?a_aid=052443b7&a_bid=aba3e9dd&desturl=', tracking: '' },
  { id: 18, name: 'Destilérka', domain: 'destilerka.cz', format: 'heureka', deeplink: 'https://ehub.cz/system/scripts/click.php?a_aid=052443b7&a_bid=d67420b4&desturl=', tracking: '' },
  { id: 19, name: '4bar', domain: '4bar.cz', format: 'heureka', deeplink: 'https://ehub.cz/system/scripts/click.php?a_aid=052443b7&a_bid=91538989&desturl=', tracking: '', enabled: false },  // affiliate programme ended 31. 10. 2026 (partner mail)
  // Alza affiliate feed: links already carry the partner id
  { id: 20, name: 'Alza', domain: 'alza.cz', format: 'google', deeplink: '', tracking: '' },
  { id: 21, name: '1ER', domain: '1er.cz', format: 'google', deeplink: 'https://ehub.cz/system/scripts/click.php?a_aid=052443b7&a_bid=e6694fef&desturl=', tracking: '' },
];

export const feedKey = (f: FeedDef) => `Feed__${f.id}`;

/** Final affiliate URL. Affiliateport feeds (Pan Alfred, Wineplanet) carry the click URL HTML-escaped once more ("&amp;"). */
export function affiliateUrl(f: FeedDef, productUrl: string): string {
  const u = productUrl.trim().replace(/&amp;/g, '&');
  if (f.deeplink) return f.deeplink + encodeURIComponent(u);
  if (f.tracking && !u.includes(f.tracking)) return u + (u.includes('?') ? '&' : '?') + f.tracking;
  return u;
}
