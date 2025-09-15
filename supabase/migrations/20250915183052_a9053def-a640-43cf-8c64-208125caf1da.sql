-- Create a default organization for development
INSERT INTO public.organizations (id, name, primary_color, secondary_color)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'AKITA Development',
  '#ff0000',
  '#1c1c1c'
) ON CONFLICT (id) DO NOTHING;

-- Add protection policies to prevent developer role modification
CREATE POLICY "Protect developer role from modification"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (name != 'developer');

CREATE POLICY "Protect developer role from deletion"
ON public.user_roles
FOR DELETE
TO authenticated
USING (name != 'developer');

-- Function to create developer user (will be called via edge function)
CREATE OR REPLACE FUNCTION public.create_developer_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dev_role_id uuid;
  org_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Get developer role ID
  SELECT id INTO dev_role_id FROM user_roles WHERE name = 'developer';
  
  -- Create developer user account in users table (will be created in auth via admin API)
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
    '00000000-0000-0000-0000-000000000002'::uuid,
    'emilmh.tc@gmail.com',
    'Developer',
    'Admin',
    org_id,
    dev_role_id,
    true,
    false,
    'active'
  ) ON CONFLICT (email) DO UPDATE SET
    role_id = dev_role_id,
    organization_id = org_id,
    first_login_completed = true,
    force_password_reset = false;
    
END;
$$;