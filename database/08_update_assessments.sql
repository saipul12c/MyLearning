-- Migration: Assessment System Overhaul
-- Run this on your Supabase SQL Editor

-- 1. Update assessment_definitions
ALTER TABLE assessment_definitions 
ADD COLUMN IF NOT EXISTS max_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER DEFAULT 0;

-- 2. Update assessment_questions
ALTER TABLE assessment_questions
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 1;

COMMENT ON COLUMN assessment_definitions.max_attempts IS 'Batas maksimal percobaan pengerjaan (0 = tidak terbatas)';
COMMENT ON COLUMN assessment_definitions.time_limit_minutes IS 'Batas waktu pengerjaan dalam menit (0 = tidak ada batas)';
COMMENT ON COLUMN assessment_questions.points IS 'Bobot poin untuk pertanyaan ini';
