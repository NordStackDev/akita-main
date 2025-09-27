-- Fix users RLS recursion and restore sane access for auth flows
BEGIN;

-- Ensure RLS is enabled on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop problematic/old policies to avoid recursion
DROP POLICY IF EXISTS "Developers can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own user row" ON public.users;
DROP POLICY IF EXISTS "Admins and developers can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own user row" ON public.users;
DROP POLICY IF EXISTS "Admins and developers can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins and developers can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins and developers can delete users" ON public.users;

-- Safe self-access policy (no recursion)
CREATE POLICY "Users can view own user row"
ON public.users
FOR SELECT
USING (id = auth.uid());

-- Admin/developer can view all users (uses security definer helper)
CREATE POLICY "Admins and developers can view all users"
ON public.users
FOR SELECT
USING (public.is_admin_or_developer());

-- Allow users to update their own row (for profile/self flags if needed)
CREATE POLICY "Users can update own user row"
ON public.users
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admin/developer can update any user (for admin UI, soft delete, etc.)
CREATE POLICY "Admins and developers can update all users"
ON public.users
FOR UPDATE
USING (public.is_admin_or_developer())
WITH CHECK (public.is_admin_or_developer());

-- Admin/developer can insert/delete user rows when needed via UI
CREATE POLICY "Admins and developers can insert users"
ON public.users
FOR INSERT
WITH CHECK (public.is_admin_or_developer());

CREATE POLICY "Admins and developers can delete users"
ON public.users
FOR DELETE
USING (public.is_admin_or_developer());

COMMIT;