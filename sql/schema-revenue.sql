-- Add cost_price to delivery_products (buy price for profit tracking)
ALTER TABLE delivery_products ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;

-- Snapshot the buy price on each order item so historical profit never changes
ALTER TABLE delivery_order_items ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;

-- Backfill existing order items from the current product cost
UPDATE delivery_order_items oi
SET cost_price = COALESCE((SELECT p.cost_price FROM delivery_products p WHERE p.id = oi.catalog_item_id), 0)
WHERE oi.cost_price IS NULL OR oi.cost_price = 0;

-- Add cancelled_at and delivered_at to delivery_orders for time-based revenue reports
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Update the status update trigger to set timestamps
CREATE OR REPLACE FUNCTION update_order_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'CANCELLED' AND OLD.status != 'CANCELLED' THEN
    NEW.cancelled_at = NOW();
  END IF;
  IF NEW.status = 'DELIVERED' AND OLD.status != 'DELIVERED' THEN
    NEW.delivered_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_timestamps ON delivery_orders;
CREATE TRIGGER trg_order_timestamps
  BEFORE UPDATE OF status ON delivery_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_timestamps();
