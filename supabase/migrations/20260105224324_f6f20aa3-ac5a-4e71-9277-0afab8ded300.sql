-- Update RLS policies to allow full access for team members with view_applications permission

-- Allow UPDATE for team members with view_applications permission
CREATE POLICY "Team members with permission can update applications"
ON public.applications
FOR UPDATE
TO authenticated
USING (public.has_team_permission(auth.uid(), 'view_applications'));

-- Allow DELETE for team members with view_applications permission
CREATE POLICY "Team members with permission can delete applications"
ON public.applications
FOR DELETE
TO authenticated
USING (public.has_team_permission(auth.uid(), 'view_applications'));