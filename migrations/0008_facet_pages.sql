-- Facet landing pages: a category (base_slug) with a preset filter (qs = canonical query string, e.g. "znacka=bozkov" or "sleva=1")
-- served at its own root URL with its own H1 / title / description / text / FAQ. No category rows are created for them.
CREATE TABLE IF NOT EXISTS facet_pages (
  id INTEGER PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  base_slug TEXT NOT NULL,
  qs TEXT NOT NULL,
  h1 TEXT NOT NULL,
  seo_title TEXT NOT NULL,
  seo_desc TEXT NOT NULL,
  intro_html TEXT NOT NULL DEFAULT '',
  second_html TEXT NOT NULL DEFAULT '',
  faq_json TEXT NOT NULL DEFAULT '',
  keyword TEXT NOT NULL DEFAULT '',
  volume INTEGER NOT NULL DEFAULT 0,
  min_products INTEGER NOT NULL DEFAULT 5,
  total INTEGER NOT NULL DEFAULT 0,
  noindex INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT ''
) STRICT;
CREATE INDEX IF NOT EXISTS facet_pages_base ON facet_pages (base_slug);
