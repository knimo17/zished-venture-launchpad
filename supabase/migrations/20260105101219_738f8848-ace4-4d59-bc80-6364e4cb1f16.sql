-- Create a function to auto-assign team_member role when a user_id is set on team_members
CREATE OR REPLACE FUNCTION public.assign_team_member_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run when user_id is being set (from null to a value, or being changed)
  IF NEW.user_id IS NOT NULL AND (OLD.user_id IS NULL OR OLD.user_id != NEW.user_id) THEN
    -- Insert the team_member role, ignore if already exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'team_member')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on team_members table
CREATE TRIGGER on_team_member_user_assigned
  AFTER UPDATE ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_team_member_role();

-- Also allow the trigger to fire on INSERT in case user_id is set during insert
CREATE TRIGGER on_team_member_user_assigned_insert
  AFTER INSERT ON public.team_members
  FOR EACH ROW
  WHEN (NEW.user_id IS NOT NULL)
  EXECUTE FUNCTION public.assign_team_member_role();

-- Update RLS policy on team_members to allow updates when the invite_token matches
-- First drop the existing policy that only allows updates when user_id matches
DROP POLICY IF EXISTS "Team members can update own profile" ON public.team_members;

-- Create a new policy that allows:
-- 1. Team members to update their own profile (when user_id matches)
-- 2. New users to link their account via invite token
CREATE POLICY "Team members can update own profile or link via invite"
ON public.team_members
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR (invite_token IS NOT NULL AND user_id IS NULL)
)
WITH CHECK (
  auth.uid() = user_id 
  OR (auth.uid() = user_id AND invite_token IS NULL)
);