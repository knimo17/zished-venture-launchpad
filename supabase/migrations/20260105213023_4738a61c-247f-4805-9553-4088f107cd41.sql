-- SECURITY: stop exposing pending invite rows publicly
DROP POLICY IF EXISTS "Public can validate invite tokens" ON public.team_members;

-- Allow signed-in users to read their own team member record (prevents false "not registered" errors)
DROP POLICY IF EXISTS "Users can view own team member record" ON public.team_members;
CREATE POLICY "Users can view own team member record"
ON public.team_members
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Tighten updates: users can only update their own record; invite linking will be done via backend function
DROP POLICY IF EXISTS "Team members can update own profile or link via invite" ON public.team_members;
CREATE POLICY "Team members can update own profile"
ON public.team_members
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);