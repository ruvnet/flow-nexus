
-- Flow Nexus Database Schema Fixes for Issue #34

-- Fix 1: Add missing pattern_type column with default value
DO $$ 
BEGIN
  -- Add pattern_type column to neural_training_jobs if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'neural_training_jobs' 
    AND column_name = 'pattern_type'
  ) THEN
    ALTER TABLE neural_training_jobs 
    ADD COLUMN pattern_type TEXT DEFAULT 'coordination';
  END IF;
  
  -- Add pattern_type column to neural_models if missing  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'neural_models' 
    AND column_name = 'pattern_type'
  ) THEN
    ALTER TABLE neural_models 
    ADD COLUMN pattern_type TEXT DEFAULT 'coordination';
  END IF;
  
  -- Add pattern_type column to neural_templates if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'neural_templates' 
    AND column_name = 'pattern_type'
  ) THEN
    ALTER TABLE neural_templates 
    ADD COLUMN pattern_type TEXT DEFAULT 'coordination';
  END IF;
END $$;

-- Fix 2: Ensure all MCP tool tables exist with proper constraints
CREATE TABLE IF NOT EXISTS mcp_tool_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix 3: Insert missing neural_list_templates tool registration
INSERT INTO mcp_tool_registry (tool_name, category, is_enabled, configuration)
VALUES (
  'neural_list_templates',
  'neural',
  true,
  '{"description": "List available neural network templates", "implemented": true}'::jsonb
) ON CONFLICT (tool_name) DO UPDATE
SET is_enabled = true, updated_at = NOW();

-- Fix 4: Create authentication unified config table
CREATE TABLE IF NOT EXISTS auth_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert unified auth settings
INSERT INTO auth_config (config_key, config_value, description)
VALUES 
  ('jwt_secret', '"your-jwt-secret-key"'::jsonb, 'JWT secret for token signing'),
  ('session_timeout', '86400'::jsonb, 'Session timeout in seconds (24 hours)'),
  ('require_auth', 'false'::jsonb, 'Whether to require authentication for all tools')
ON CONFLICT (config_key) DO NOTHING;

-- Fix 5: Enable RLS and create policies
ALTER TABLE mcp_tool_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_config ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated access
CREATE POLICY "Allow authenticated users to read tools"
  ON mcp_tool_registry FOR SELECT
  USING (true); -- Allow all authenticated users to read

CREATE POLICY "Allow authenticated users to read auth config"
  ON auth_config FOR SELECT  
  USING (true);
