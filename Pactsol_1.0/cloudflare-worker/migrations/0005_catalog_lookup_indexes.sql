CREATE INDEX IF NOT EXISTS idx_catalog_categories_active_sort
  ON catalog_categories(active, sort_order);

CREATE INDEX IF NOT EXISTS idx_catalog_products_category_active_sort
  ON catalog_products(category_id, active, sort_order);