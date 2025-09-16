-- Create security definer function to check if user has admin or developer role
CREATE OR REPLACE FUNCTION public.is_admin_or_developer()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.user_roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.name IN ('admin', 'developer')
  );
$$;

-- Companies table policies for admin/developer
CREATE POLICY "Admins and developers can select all companies"
ON public.companies
FOR SELECT
TO authenticated
USING (public.is_admin_or_developer());

CREATE POLICY "Admins and developers can insert companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_developer());

CREATE POLICY "Admins and developers can update companies"
ON public.companies
FOR UPDATE
TO authenticated
USING (public.is_admin_or_developer());

CREATE POLICY "Admins and developers can delete companies"
ON public.companies
FOR DELETE
TO authenticated
USING (public.is_admin_or_developer());

-- Organizations table policies for admin/developer
CREATE POLICY "Admins and developers can select all organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (public.is_admin_or_developer());

CREATE POLICY "Admins and developers can insert organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_developer());

CREATE POLICY "Admins and developers can update organizations"
ON public.organizations
FOR UPDATE
TO authenticated
USING (public.is_admin_or_developer());

CREATE POLICY "Admins and developers can delete organizations"
ON public.organizations
FOR DELETE
TO authenticated
USING (public.is_admin_or_developer());

-- Users table policies for admin/developer (enable RLS first)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and developers can select all users"
ON public.users
FOR SELECT
TO authenticated
USING (public.is_admin_or_developer());

CREATE POLICY "Admins and developers can insert users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_developer());

CREATE POLICY "Admins and developers can update users"
ON public.users
FOR UPDATE
TO authenticated
USING (public.is_admin_or_developer());

CREATE POLICY "Admins and developers can delete users"
ON public.users
FOR DELETE
TO authenticated
USING (public.is_admin_or_developer());