-- Fix RLS issues found by linter

-- 1. Enable RLS on locations table (currently disabled)
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- 2. Fix search_path issues in functions by updating them with proper search_path
CREATE OR REPLACE FUNCTION public.get_table_stats()
RETURNS TABLE(schemaname text, tablename text, n_live_tup bigint, n_dead_tup bigint, last_vacuum timestamp with time zone, last_autovacuum timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        schemaname::text,
        relname::text,
        n_live_tup,
        n_dead_tup,
        last_vacuum,
        last_autovacuum
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
    ORDER BY n_dead_tup DESC;
$$;

-- 3. Fix the developer user creation function to ensure it has proper auth user
CREATE OR REPLACE FUNCTION public.create_developer_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dev_role_id uuid;
  org_id uuid := '00000000-0000-0000-0000-000000000001';
  dev_user_id uuid := 'ab76ca1d-6020-4f9d-bdd6-2a7707f1d389';
BEGIN
  -- Get developer role ID
  SELECT id INTO dev_role_id FROM user_roles WHERE name = 'developer';
  
  -- Ensure developer user exists and is properly configured
  INSERT INTO users (
    id, 
    email, 
    first_name, 
    last_name, 
    organization_id, 
    role_id,
    first_login_completed,
    force_password_reset,
    status
  ) VALUES (
    dev_user_id,
    'emilmh.tc@gmail.com',
    'Developer',
    'Admin',
    org_id,
    dev_role_id,
    true,
    false,
    'active'
  ) ON CONFLICT (id) DO UPDATE SET
    role_id = dev_role_id,
    organization_id = org_id,
    first_login_completed = true,
    force_password_reset = false,
    status = 'active',
    deleted_at = NULL;

  -- Ensure profile exists
  INSERT INTO profiles (user_id, organization_id, role_id)
  VALUES (dev_user_id, org_id, dev_role_id)
  ON CONFLICT (user_id) DO UPDATE SET 
    organization_id = org_id,
    role_id = dev_role_id;
    
END;
$$;

-- Run the function to fix developer user
SELECT public.create_developer_user();

-- 4. Ensure all necessary RLS policies exist for locations
DROP POLICY IF EXISTS "Admin users full access" ON public.locations;
DROP POLICY IF EXISTS "Admins and CEOs can create locations" ON public.locations;

CREATE POLICY "Admin users full access" 
ON public.locations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM users u 
    JOIN user_roles ur ON u.role_id = ur.id 
    WHERE u.id = auth.uid() 
    AND ur.name = ANY(ARRAY['ceo', 'developer', 'admin'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM users u 
    JOIN user_roles ur ON u.role_id = ur.id 
    WHERE u.id = auth.uid() 
    AND ur.name = ANY(ARRAY['ceo', 'developer', 'admin'])
  )
);

CREATE POLICY "Users can view locations in their organization" 
ON public.locations 
FOR SELECT 
USING (
  office_id IN (
    SELECT o.id 
    FROM offices o 
    WHERE o.organization_id = get_user_organization_id(auth.uid())
    AND o.deleted_at IS NULL
  )
  AND deleted_at IS NULL
);

-- 5. Fix any missing policies or issues with other tables
-- Ensure users table has proper policies for developer access
DROP POLICY IF EXISTS "Developers can manage all users" ON public.users;
CREATE POLICY "Developers can manage all users" 
ON public.users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() 
    AND r.name = 'developer'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() 
    AND r.name = 'developer'
  )
);