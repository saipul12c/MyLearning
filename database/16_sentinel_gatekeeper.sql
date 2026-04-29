-- Sentinel Gatekeeper System
-- Controls global application state and feature flags

CREATE TABLE IF NOT EXISTS public.sentinel_configs (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    pending_value JSONB, -- Value to be applied at release_at
    release_at TIMESTAMPTZ, -- Scheduled time for pending_value to go live
    rollout_percentage INTEGER DEFAULT 100, -- 0 to 100 for canary releases
    targeting_roles TEXT[] DEFAULT '{}', -- Roles that get 100% access (e.g. {'admin', 'instructor'})
    description TEXT,
    category TEXT DEFAULT 'general',
    is_public BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}', -- Stores changelog, impact, and dev notes
    is_protected BOOLEAN DEFAULT FALSE, -- If TRUE, this config cannot be deleted
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.sentinel_configs ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Admins have full access to sentinel_configs
DROP POLICY IF EXISTS "Admins have full access to sentinel_configs" ON public.sentinel_configs;
CREATE POLICY "Admins have full access to sentinel_configs"
ON public.sentinel_configs
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- 2. Everyone can read public configs
DROP POLICY IF EXISTS "Everyone can read public sentinel_configs" ON public.sentinel_configs;
CREATE POLICY "Everyone can read public sentinel_configs"
ON public.sentinel_configs
FOR SELECT
TO public
USING (is_public = TRUE);

-- Initial Data
INSERT INTO public.sentinel_configs (key, value, description, category, is_public, rollout_percentage, targeting_roles)
VALUES 
('maintenance_mode', 'false', 'Enable/disable global maintenance mode', 'system', TRUE, 100, '{}'),
('module_auth_enabled', 'true', 'Kontrol akses login dan registrasi', 'security', TRUE, 100, '{}'),
('module_payment_enabled', 'true', 'Kontrol sistem transaksi dan pembayaran', 'security', TRUE, 100, '{}'),
('module_upload_enabled', 'true', 'Kontrol fitur upload file ke storage', 'security', TRUE, 100, '{}'),
('allow_new_enrollments', 'true', 'Enable/disable new course enrollments', 'feature', TRUE, 100, '{}'),
('security_lockdown', 'false', 'Lock down all write operations', 'security', FALSE, 100, '{}'),
('ai_tutor_beta', 'false', 'Aktifkan fitur tutor AI berbasis Gemini 1.5 Pro', 'feature', TRUE, 0, '{}'),
('system_version', '"1.3.0"', 'Current stable system version', 'system', TRUE, 100, '{}'),
('code_fingerprint', '""', 'Hash of the current source code manifest', 'system', FALSE, 100, '{}'),
('ddos_protection_enabled', 'false', 'Aktifkan sistem filtrasi trafik otomatis', 'security', TRUE, 100, '{}'),
('ddos_protection_level', '"low"', 'Level proteksi: low (soft), medium (rate-limit), high (challenge)', 'security', TRUE, 100, '{}'),
('ddos_rate_limit', '100', 'Maksimal request per menit per IP (hanya efektif di level medium/high)', 'security', TRUE, 100, '{}')
ON CONFLICT (key) DO NOTHING;
