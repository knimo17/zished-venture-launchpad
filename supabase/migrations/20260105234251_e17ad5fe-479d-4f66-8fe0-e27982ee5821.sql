-- Fix function search path for security
CREATE OR REPLACE FUNCTION public.calculate_goal_progress(goal_uuid uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    CASE 
      WHEN COUNT(*) FILTER (WHERE is_required = true) = 0 THEN 100
      ELSE (COUNT(*) FILTER (WHERE status = 'completed' AND is_required = true) * 100 / 
            NULLIF(COUNT(*) FILTER (WHERE is_required = true), 0))::integer
    END,
    0
  )
  FROM public.tasks
  WHERE goal_id = goal_uuid;
$$;