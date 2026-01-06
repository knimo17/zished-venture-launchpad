-- Add created_by column to goals table to track who assigned a goal
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.team_members(id);

-- Create helper function for checking permissions (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.team_member_has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_members tm
    JOIN team_member_permissions tmp ON tmp.team_member_id = tm.id
    WHERE tm.user_id = _user_id
      AND tmp.permission = _permission
  )
$$;

-- Create helper function to get current user's team_member_id
CREATE OR REPLACE FUNCTION public.get_current_team_member_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM team_members WHERE user_id = auth.uid() LIMIT 1
$$;