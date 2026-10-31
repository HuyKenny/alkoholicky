-- "Biggest discount" sort without a temp sort of the whole category (disc then pop within it).
DROP INDEX IF EXISTS idx_cp_disc;
CREATE INDEX idx_cp_disc ON cat_products(cat_id, disc DESC, pop DESC);
