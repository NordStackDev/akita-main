-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.generate_invitation_code()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT upper(substring(encode(gen_random_bytes(4), 'hex') from 1 for 8));
$$;