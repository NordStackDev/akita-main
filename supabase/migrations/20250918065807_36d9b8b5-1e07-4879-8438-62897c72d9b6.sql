-- Fix the create_company_for_current_user function
CREATE OR REPLACE FUNCTION public.create_company_for_current_user(
  _name text,
  _cvr text DEFAULT NULL,
  _address text DEFAULT NULL,
  _city text DEFAULT NULL,
  _postal_code text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _company_type text DEFAULT NULL,
  _primary_color text DEFAULT '#ff0000',
  _secondary_color text DEFAULT '#1c1c1c'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_company_id uuid;
  v_org_id uuid;
  v_user_id uuid := auth.uid();
  v_role_name text;
  v_role_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user's current role
  SELECT r.name, u.role_id
    INTO v_role_name, v_role_id
  FROM public.users u
  JOIN public.user_roles r ON u.role_id = r.id
  WHERE u.id = v_user_id;

  IF v_role_name IS NULL THEN
    RAISE EXCEPTION 'User role not found';
  END IF;

  -- Only CEOs, admins, and developers can create companies
  IF lower(v_role_name) NOT IN ('ceo', 'admin', 'developer') THEN
    RAISE EXCEPTION 'Not allowed to create company';
  END IF;

  -- Create the company
  INSERT INTO public.companies (name, cvr, address, city, postal_code, phone, company_type, primary_color, secondary_color)
  VALUES (_name, _cvr, _address, _city, _postal_code, _phone, _company_type, _primary_color, _secondary_color)
  RETURNING id INTO v_company_id;

  -- Create the main organization for the company
  INSERT INTO public.organizations (name, company_id, primary_color, secondary_color)
  VALUES (_name || ' Hovedorganisation', v_company_id, _primary_color, _secondary_color)
  RETURNING id INTO v_org_id;

  -- Update user to belong to this organization and mark onboarding as complete
  UPDATE public.users
     SET organization_id = v_org_id,
         first_login_completed = true,
         updated_at = now()
   WHERE id = v_user_id;

  -- Create or update profile
  INSERT INTO public.profiles (user_id, organization_id, role_id)
  VALUES (v_user_id, v_org_id, v_role_id)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    organization_id = EXCLUDED.organization_id,
    role_id = EXCLUDED.role_id,
    updated_at = now();

  RETURN v_company_id;
END;
$$;

-- Add missing columns to invitation_codes table for role-based invitations
ALTER TABLE public.invitation_codes 
ADD COLUMN IF NOT EXISTS invited_role text,
ADD COLUMN IF NOT EXISTS invited_org_id uuid,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS company_name text;