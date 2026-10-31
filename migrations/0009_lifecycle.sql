-- Product lifecycle (retire after 60 days without an offer, 301 to its category) and search/GSC signals for the default ranking.
ALTER TABLE products ADD COLUMN last_offer_at TEXT NOT NULL DEFAULT '';   -- last day the product had an active offer (nightly, produkty-zivotni-cyklus.py)
CREATE TABLE IF NOT EXISTS product_signals (
  product_id INTEGER PRIMARY KEY,
  impressions INTEGER NOT NULL DEFAULT 0,   -- Google Search impressions of the product page, last 28 days (gsc-signaly.py, nightly)
  gsc_clicks INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
) STRICT;
