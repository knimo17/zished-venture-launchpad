-- Create team_member_permissions table
CREATE TABLE public.team_member_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  permission text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (team_member_id, permission)
);

-- Enable RLS
ALTER TABLE public.team_member_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all permissions
CREATE POLICY "Admins can manage permissions"
ON public.team_member_permissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Team members can view their own permissions
CREATE POLICY "Team members can view own permissions"
ON public.team_member_permissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.id = team_member_permissions.team_member_id
    AND tm.user_id = auth.uid()
  )
);

-- Create helper function to check team member permissions
CREATE OR REPLACE FUNCTION public.has_team_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_member_permissions tmp
    JOIN team_members tm ON tm.id = tmp.team_member_id
    WHERE tm.user_id = _user_id
      AND tmp.permission = _permission
  )
$$;

-- Add RLS policy for team members to view applications if they have permission
CREATE POLICY "Team members with permission can view applications"
ON public.applications
FOR SELECT
USING (has_team_permission(auth.uid(), 'view_applications'));