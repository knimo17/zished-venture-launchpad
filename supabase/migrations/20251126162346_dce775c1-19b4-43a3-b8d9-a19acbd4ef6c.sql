-- Drop the existing status check constraint if it exists
ALTER TABLE public.applications 
DROP CONSTRAINT IF EXISTS applications_status_check;

-- Add a proper status check constraint with all allowed values
ALTER TABLE public.applications 
ADD CONSTRAINT applications_status_check 
CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected'));

-- Add notes column for admin notes on applications
ALTER TABLE public.applications 
ADD COLUMN IF NOT EXISTS admin_notes text;