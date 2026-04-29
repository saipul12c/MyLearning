-- ============================================
-- 22_tier_payments.sql
-- MyLearning - Tier Payment Integration
-- ============================================

-- 1. TIER PURCHASES TABLE
CREATE TABLE IF NOT EXISTS tier_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    tier_id UUID NOT NULL REFERENCES tiers(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'waiting_verification', 'paid', 'rejected', 'expired')),
    payment_proof_url TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tier_id, status) -- Prevent duplicate active requests for same tier
);

-- 2. TRIGGER TO ACTIVATE TIER UPON PAYMENT
CREATE OR REPLACE FUNCTION trg_activate_tier_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
        -- Update the user's tier
        UPDATE user_profiles 
        SET tier_id = NEW.tier_id 
        WHERE user_id = NEW.user_id;
        
        -- Create notification
        INSERT INTO notifications (user_id, title, message, type, link_url)
        VALUES (
            NEW.user_id,
            'Upgrade Tier Berhasil! 🏆',
            'Selamat! Akun Anda telah berhasil di-upgrade. Nikmati fitur eksklusif sekarang.',
            'success',
            '/profile'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_tier_purchase_activation
BEFORE UPDATE ON tier_purchases
FOR EACH ROW
EXECUTE FUNCTION trg_activate_tier_on_payment();

-- 3. RLS POLICIES
ALTER TABLE tier_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases" 
ON tier_purchases FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases" 
ON tier_purchases FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending purchases" 
ON tier_purchases FOR UPDATE 
USING (auth.uid() = user_id AND (status = 'pending' OR status = 'rejected'));

CREATE POLICY "Admins can manage all tier purchases" 
ON tier_purchases FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE user_id = auth.uid() AND role = 'admin'
    )
);

-- 4. REAL-TIME
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'tier_purchases'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tier_purchases;
  END IF;
END $$;
