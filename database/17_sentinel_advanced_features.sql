-- Migration: Add Advanced Sentinel Features
-- Implementation of Items 1, 2, 3, and 6

ALTER TABLE public.sentinel_configs 
ADD COLUMN IF NOT EXISTS dependencies TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS error_threshold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_errors INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS locked_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

-- Update existing data to have some default thresholds for critical features
UPDATE public.sentinel_configs 
SET error_threshold = 10 
WHERE key IN ('module_payment_enabled', 'module_auth_enabled');

UPDATE public.sentinel_configs 
SET dependencies = '{"module_auth_enabled"}'
WHERE key = 'ai_tutor_beta';

COMMENT ON COLUMN public.sentinel_configs.dependencies IS 'List of feature keys that must be TRUE for this feature to work';
COMMENT ON COLUMN public.sentinel_configs.error_threshold IS 'Number of errors allowed before auto-disabling (0 = disabled)';
COMMENT ON COLUMN public.sentinel_configs.locked_by IS 'User ID who currently holds the edit lock';

-- v1.1.0 Upgrades: Geo-Fencing, QoS, and Expiry
ALTER TABLE public.sentinel_configs 
ADD COLUMN IF NOT EXISTS allowed_countries TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rate_limit_overrides JSONB DEFAULT '{}', -- e.g. {"free": 50, "premium": 500}
ADD COLUMN IF NOT EXISTS expire_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS broadcast_on_disable BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS broadcast_message TEXT;

CREATE INDEX IF NOT EXISTS idx_sentinel_expire_at ON public.sentinel_configs(expire_at);

COMMENT ON COLUMN public.sentinel_configs.allowed_countries IS 'List of ISO country codes allowed to access this feature';
COMMENT ON COLUMN public.sentinel_configs.rate_limit_overrides IS 'Custom rate limits per user tier';
COMMENT ON COLUMN public.sentinel_configs.expire_at IS 'Timestamp when this feature should automatically be disabled';
COMMENT ON COLUMN public.sentinel_configs.broadcast_message IS 'Custom message to show when this feature is disabled';

-- Enable Realtime for Sentinel Broadcast System (v1.1.0)
ALTER PUBLICATION supabase_realtime ADD TABLE public.sentinel_configs;
