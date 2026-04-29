-- Migration: Sentinel Announcement Integration
-- Automatically creates global announcements when Sentinel features are toggled

-- 1. Create a function to handle automated announcements
CREATE OR REPLACE FUNCTION handle_sentinel_announcement()
RETURNS TRIGGER AS $$
DECLARE
    v_title TEXT;
    v_message TEXT;
    v_promo_id UUID;
    v_impact_color TEXT;
BEGIN
    -- Only trigger if the value has actually changed and it's a public feature
    IF (OLD.value IS DISTINCT FROM NEW.value AND NEW.is_public = TRUE) THEN
        
        -- Determine impact color for the announcement
        v_impact_color := CASE 
            WHEN (NEW.metadata->>'impact' = 'critical') THEN '#ef4444' -- Red
            WHEN (NEW.metadata->>'impact' = 'high') THEN '#f97316'    -- Orange
            WHEN (NEW.metadata->>'impact' = 'medium') THEN '#3b82f6'  -- Blue
            ELSE '#10b981'                                            -- Green
        END;

        v_title := 'Update Sistem: ' || NEW.key;
        v_message := 'Fitur "' || COALESCE(NEW.description, NEW.key) || '" telah diperbarui menjadi: ' || (NEW.value)::text;

        -- A. Create a Global Announcement Bar (Promotions table)
        -- We'll use a deterministic ID based on the key to avoid duplicate bars for the same feature
        v_promo_id := uuid_generate_v5(uuid_ns_dns(), 'sentinel.' || NEW.key);

        INSERT INTO public.promotions (
            id,
            title,
            description,
            location,
            badge_text,
            is_active,
            is_external,
            priority,
            bg_color,
            link_url,
            start_date,
            end_date
        ) VALUES (
            v_promo_id,
            v_title,
            v_message,
            'global_announcement',
            'SYSTEM',
            TRUE,
            FALSE,
            10, -- High priority
            v_impact_color,
            '/dashboard', -- Link to dashboard
            NOW(),
            NOW() + INTERVAL '3 days' -- Show for 3 days
        )
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            bg_color = EXCLUDED.bg_color,
            start_date = NOW(),
            end_date = NOW() + INTERVAL '3 days',
            is_active = TRUE;

        -- B. Optional: Create a generic log in broadcast_logs
        INSERT INTO public.broadcast_logs (
            admin_id,
            title,
            message,
            type,
            category,
            target_role,
            sent_at
        ) VALUES (
            NEW.updated_by,
            v_title,
            v_message,
            'info',
            'system',
            'all',
            NOW()
        );

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach the trigger
DROP TRIGGER IF EXISTS trg_sentinel_announcement ON public.sentinel_configs;
CREATE TRIGGER trg_sentinel_announcement
AFTER UPDATE OF value ON public.sentinel_configs
FOR EACH ROW
EXECUTE FUNCTION handle_sentinel_announcement();

COMMENT ON FUNCTION handle_sentinel_announcement() IS 'Automatically creates a global announcement bar when a public Sentinel feature is toggled.';
