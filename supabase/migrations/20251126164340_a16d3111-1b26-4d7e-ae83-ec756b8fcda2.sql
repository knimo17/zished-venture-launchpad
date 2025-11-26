-- Create internships table
CREATE TABLE public.internships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  portfolio_company TEXT NOT NULL,
  description TEXT NOT NULL,
  responsibilities TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;

-- Anyone can view active internships
CREATE POLICY "Anyone can view active internships"
ON public.internships
FOR SELECT
USING (is_active = true);

-- Admins can manage all internships
CREATE POLICY "Admins can manage internships"
ON public.internships
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add internship_id to applications table
ALTER TABLE public.applications
ADD COLUMN internship_id UUID REFERENCES public.internships(id) ON DELETE SET NULL;

-- Create trigger for updated_at on internships
CREATE TRIGGER update_internships_updated_at
BEFORE UPDATE ON public.internships
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();