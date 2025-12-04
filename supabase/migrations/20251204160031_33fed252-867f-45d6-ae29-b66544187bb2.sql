-- Add new columns for enhanced AI evaluation data
ALTER TABLE public.ai_evaluation 
ADD COLUMN IF NOT EXISTS honesty_assessment jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS style_profile jsonb DEFAULT '{}'::jsonb;