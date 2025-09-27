-- Ensure user_roles is readable for authenticated users and managed by admins
BEGIN;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Allow all authenticated users to read role definitions
CREATE POLICY "Anyone can read roles"
ON public.user_roles
FOR SELECT
USING (true);

-- Restrict write operations to admins/developers
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin_or_developer());

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.is_admin_or_developer())
WITH CHECK (public.is_admin_or_developer());

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.is_admin_or_developer());

COMMIT;