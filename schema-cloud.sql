-- Cloud storage connections table
-- Stores OAuth tokens for Google Drive / OneDrive
CREATE TABLE IF NOT EXISTS delivery_cloud_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('google_drive', 'onedrive')),
  account_email TEXT NOT NULL,
  account_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  folder_id TEXT,
  folder_name TEXT DEFAULT 'MISTER-DR Backups',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE delivery_cloud_connections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cloud_connections_service_all' AND tablename = 'delivery_cloud_connections') THEN
    CREATE POLICY cloud_connections_service_all ON delivery_cloud_connections FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT ALL ON delivery_cloud_connections TO service_role;
GRANT SELECT ON delivery_cloud_connections TO anon;

-- App folder ID setting
INSERT INTO delivery_settings (key, value) VALUES ('cloud_folder_id', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Google login support: add google_id and avatar_url to users table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'google_id') THEN
    ALTER TABLE users ADD COLUMN google_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
    ALTER TABLE users ADD COLUMN avatar_url TEXT;
  END IF;
END $$;
