-- Drop the restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can update applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can delete applications" ON public.applications;
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.applications;

-- Recreate as PERMISSIVE policies (the default)
CREATE POLICY "Admins can view all applications" 
ON public.applications 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update applications" 
ON public.applications 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete applications" 
ON public.applications 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can submit applications" 
ON public.applications 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);