-- Allow public to look up team members by invite token for signup
CREATE POLICY "Public can validate invite tokens"
ON public.team_members
FOR SELECT
USING (invite_token IS NOT NULL);