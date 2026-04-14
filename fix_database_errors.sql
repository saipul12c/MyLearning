-- Fix for "Could not find the 'ban_reason' column of 'user_profiles'"
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Fix for "column reference 'promo_id' is ambiguous" error in RPC
CREATE OR REPLACE FUNCTION increment_ad_impressions(
    promo_id UUID, 
    p_user_id UUID DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    v_last_log TIMESTAMPTZ;
    v_final_ip TEXT;
BEGIN
    -- Use provided IP or try to get it from request headers (Supabase compatible)
    v_final_ip := COALESCE(p_ip_address, current_setting('request.headers', true)::json->>'x-forwarded-for');

    -- Check for recent log from same user or IP (within 5 minutes)
    IF p_user_id IS NOT NULL OR v_final_ip IS NOT NULL THEN
        SELECT created_at INTO v_last_log 
        FROM promotion_impression_logs 
        WHERE promotion_impression_logs.promo_id = increment_ad_impressions.promo_id 
          AND (
              (p_user_id IS NOT NULL AND user_id = p_user_id) OR 
              (v_final_ip IS NOT NULL AND ip_address = v_final_ip)
          )
          AND created_at > NOW() - INTERVAL '5 minutes'
        LIMIT 1;
    END IF;

    -- If no recent log, proceed with increment
    IF v_last_log IS NULL THEN
        UPDATE promotions
        SET 
            current_impressions = current_impressions + 1,
            is_active = CASE 
                WHEN (target_impressions > 0 AND (current_impressions + 1) >= target_impressions) OR (end_date IS NOT NULL AND NOW() >= end_date) THEN FALSE 
                ELSE is_active 
            END,
            updated_at = NOW()
        WHERE id = increment_ad_impressions.promo_id;

        -- Log the impression (Fixed Ambiguous column by explicitly scoping it)
        INSERT INTO promotion_impression_logs (promo_id, user_id, ip_address)
        VALUES (increment_ad_impressions.promo_id, p_user_id, v_final_ip);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
