-- Drop and recreate the UPDATE policy with correct with_check for invite linking
DROP POLICY IF EXISTS "Team members can update own profile or link via invite" ON public.team_members;

CREATE POLICY "Team members can update own profile or link via invite"
ON public.team_members
FOR UPDATE
TO public
USING (
  (auth.uid() = user_id) OR 
  ((invite_token IS NOT NULL) AND (user_id IS NULL))
)
WITH CHECK (
  (auth.uid() = user_id) OR 
  ((invite_token IS NOT NULL) AND (user_id IS NULL))
);