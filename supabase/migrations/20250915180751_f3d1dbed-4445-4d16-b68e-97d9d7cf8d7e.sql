-- Create invitation codes table for admin-sent invitations
CREATE TABLE public.invitation_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  email text NOT NULL,
  created_by_user_id uuid REFERENCES public.users(id),
  used_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

-- Admins can create and view invitation codes
CREATE POLICY "Admins can manage invitation codes"
ON public.invitation_codes
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u 
    JOIN public.user_roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND r.level <= 2
  )
);

-- Function to generate random invitation code
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS text
LANGUAGE sql
AS $$
  SELECT upper(substring(encode(gen_random_bytes(4), 'hex') from 1 for 8));
$$;

-- Update users table to track first login
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS first_login_completed boolean DEFAULT false;