-- Create site_content table for CMS
CREATE TABLE public.site_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  section TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read site content (public)
CREATE POLICY "Anyone can view site content"
ON public.site_content
FOR SELECT
USING (true);

-- Only admins can manage content
CREATE POLICY "Admins can manage site content"
ON public.site_content
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_site_content_updated_at
BEFORE UPDATE ON public.site_content
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default content
INSERT INTO public.site_content (key, value, section) VALUES
-- Hero section
('hero_label', 'VENTURE STUDIO', 'hero'),
('hero_headline', 'Build ventures you don''t have to start from scratch', 'hero'),
('hero_cta', 'Build with us', 'hero'),

-- About section
('about_headline', 'We build and scale African companies with global standards', 'about'),
('about_description', 'verigo54 is a venture studio building multiple businesses across food, media & creative production, logistics, commerce infrastructure, and travel. We provide shared backend operations so operators can focus on growth and execution.', 'about'),
('about_ops_title', 'Shared Operations', 'about'),
('about_ops_description', 'Accounting, legal, HR, branding, marketing, finance, creative production, tech tools, and logistics support.', 'about'),
('about_growth_title', 'Focus on Growth', 'about'),
('about_growth_description', 'Operators focus on revenue growth, team leadership, customer experience, and execution — not backend systems.', 'about'),
('about_ventures_title', 'Multiple Ventures', 'about'),
('about_ventures_description', 'You''re not joining one business — you''ll grow multiple ventures over time with studio backing.', 'about'),

-- Announcement banner
('announcement_text', 'Venture Operators: Join verigo54 & Build African Companies With Global Standards', 'announcement'),
('announcement_cta', 'Apply Now', 'announcement');