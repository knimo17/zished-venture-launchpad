-- Remove the unique constraint on user_id to allow placeholder values
-- Team members will have their user_id updated when they complete signup
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_user_id_key;

-- Add an invite_token column to link signups
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS invite_token text UNIQUE;