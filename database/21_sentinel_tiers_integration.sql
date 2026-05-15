-- ============================================
-- 21_sentinel_tiers_integration.sql
-- MyLearning - Sentinel Integration for Tiers & Achievements
-- ============================================

INSERT INTO public.sentinel_configs (key, value, description, category, is_public, rollout_percentage, targeting_roles)
VALUES 
('module_tiers_enabled', 'true', 'Aktifkan sistem Tier dan pendaftaran berbayar bertingkat', 'feature', TRUE, 100, '{}'),
('module_achievements_enabled', 'true', 'Aktifkan sistem pencapaian dan reward otomatis', 'feature', TRUE, 100, '{}')
ON CONFLICT (key) DO NOTHING;

-- Update system version in Sentinel
UPDATE public.sentinel_configs 
SET value = '"1.1.0"' 
WHERE key = 'system_version';

-- Refresh cache PostgREST
NOTIFY pgrst, 'reload schema';
