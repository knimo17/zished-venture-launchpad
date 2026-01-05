-- Add explicit DELETE policy for admins on team_members
CREATE POLICY "Admins can delete team members"
ON public.team_members
FOR DELETE
TO public
USING (has_role(auth.uid(), 'admin'::app_role));