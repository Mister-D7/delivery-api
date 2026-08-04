-- Schema: driver cost + employees (comptabilité)
-- Run this in the Supabase SQL Editor. Safe to re-run (idempotent).

-- 1. Coût livreur par commande (combien on paie le livreur)
ALTER TABLE delivery_orders
  ADD COLUMN IF NOT EXISTS driver_cost NUMERIC DEFAULT 0;

-- 2. Table employés (salaires mensuels)
CREATE TABLE IF NOT EXISTS delivery_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Employé',
  gross_salary NUMERIC DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS activée : seul le serveur (service_role) peut accéder à la table.
-- Aucune politique → anon/authenticated bloqués par défaut.
ALTER TABLE delivery_employees ENABLE ROW LEVEL SECURITY;

-- 3. Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

DO $do$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at') THEN
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END;
$do$;

DROP TRIGGER IF EXISTS trg_employees_updated_at ON delivery_employees;
CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON delivery_employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
