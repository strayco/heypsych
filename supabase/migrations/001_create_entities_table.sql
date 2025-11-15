-- Create entities table
-- This is the foundation table for all content types (treatments, conditions, resources)

CREATE TABLE IF NOT EXISTS entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  type text NOT NULL,
  name text NOT NULL,
  description text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(type);
CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status);
CREATE INDEX IF NOT EXISTS idx_entities_type_status ON entities(type, status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON entities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE entities IS 'Universal content table storing treatments, conditions, and resources';
COMMENT ON COLUMN entities.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN entities.type IS 'Entity type: medication, therapy, condition, resource, etc.';
COMMENT ON COLUMN entities.data IS 'Full JSON content from source files';
COMMENT ON COLUMN entities.metadata IS 'Additional metadata (category, codes, etc.)';
COMMENT ON COLUMN entities.status IS 'Publication status: active, draft, archived';
