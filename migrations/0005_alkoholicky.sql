-- alkoholicky.cz specifics (27. 10. 2026): category buying guide + FAQ (WordPress term meta ah_guide/ah_faq, rendered by
-- the mu-plugin ah-seo.php), second description and Rank Math overrides of brands.
ALTER TABLE categories ADD COLUMN guide_html TEXT NOT NULL DEFAULT '';
ALTER TABLE categories ADD COLUMN faq_json TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN second_html TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN seo_title TEXT NOT NULL DEFAULT '';
ALTER TABLE brands ADD COLUMN seo_desc TEXT NOT NULL DEFAULT '';
ALTER TABLE posts ADD COLUMN ld_json TEXT NOT NULL DEFAULT '';
