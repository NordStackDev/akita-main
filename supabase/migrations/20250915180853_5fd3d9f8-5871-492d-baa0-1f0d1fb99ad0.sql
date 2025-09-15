-- Fix function to generate invitation codes using available functions
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
$$;