-- Remove team member delete permission on applications - deletion should be admin only
DROP POLICY IF EXISTS "Team members with permission can delete applications" ON public.applications;