-- MISTER-DR Delivery — Order Archive
-- Run this in Supabase SQL Editor (idempotent, safe to re-run)
-- Adds an additive 'archived' flag + 'archived_at' timestamp to delivery_orders.
-- Existing rows get archived = false (no data lost).

ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
ALTER TABLE delivery_orders ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
