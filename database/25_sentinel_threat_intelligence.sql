-- Sentinel Threat Intelligence & Auto-Lockdown
-- Tracks suspicious activities and blocks malicious IPs

CREATE TABLE IF NOT EXISTS public.sentinel_threat_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL UNIQUE,
    threat_level TEXT DEFAULT 'low', -- low, medium, high, critical
    reason TEXT,
    is_blocked BOOLEAN DEFAULT TRUE,
    blocked_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ, -- If NULL, block is permanent
    metadata JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sentinel_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    email TEXT,
    attempt_count INTEGER DEFAULT 1,
    last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    UNIQUE(ip_address, email)
);

-- Enable RLS
ALTER TABLE public.sentinel_threat_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sentinel_login_attempts ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Admins have full access to threat intelligence" ON public.sentinel_threat_intelligence;
CREATE POLICY "Admins have full access to threat intelligence"
ON public.sentinel_threat_intelligence
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can view login attempts" ON public.sentinel_login_attempts;
CREATE POLICY "Admins can view login attempts"
ON public.sentinel_login_attempts
FOR SELECT
TO authenticated
USING (is_admin());

-- Index for fast lookup in middleware
CREATE INDEX IF NOT EXISTS idx_sentinel_threat_ip ON public.sentinel_threat_intelligence(ip_address) WHERE is_blocked = TRUE;

-- Function to increment login attempts
CREATE OR REPLACE FUNCTION public.increment_login_attempt(p_ip TEXT, p_email TEXT)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    INSERT INTO public.sentinel_login_attempts (ip_address, email, attempt_count, last_attempt_at)
    VALUES (p_ip, p_email, 1, NOW())
    ON CONFLICT (ip_address, email) 
    DO UPDATE SET 
        attempt_count = sentinel_login_attempts.attempt_count + 1,
        last_attempt_at = NOW()
    RETURNING attempt_count INTO v_count;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

