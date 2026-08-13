-- Supplemental: add flash_sale_starts column
ALTER TABLE delivery_products ADD COLUMN IF NOT EXISTS flash_sale_starts TIMESTAMPTZ;
