-- Allow invite rows before signup by making user_id nullable
ALTER TABLE public.team_members
  ALTER COLUMN user_id DROP NOT NULL;

-- Backfill: invite rows should not be linked to an admin placeholder user_id
UPDATE public.team_members
SET user_id = NULL
WHERE invite_token IS NOT NULL;

-- Ensure team_member role is assigned automatically when a team_member record gets linked to a user
DROP TRIGGER IF EXISTS team_members_assign_team_member_role ON public.team_members;

CREATE TRIGGER team_members_assign_team_member_role
AFTER INSERT OR UPDATE OF user_id ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.assign_team_member_role();
