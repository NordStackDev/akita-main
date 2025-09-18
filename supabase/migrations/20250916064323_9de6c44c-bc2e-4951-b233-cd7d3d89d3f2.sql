-- Create companies table for the top-level business entities
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  cvr text,
  address text,
  city text,
  postal_code text,
  phone text,
  company_type text CHECK (company_type IN ('TM', 'FM')),
  primary_color text DEFAULT '#ff0000',
  secondary_color text DEFAULT '#1c1c1c',
  logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Add company_id to organizations table 
ALTER TABLE public.organizations ADD COLUMN company_id uuid REFERENCES public.companies(id);

-- CEOs can create companies
CREATE POLICY "CEOs can create companies" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.users u 
    JOIN public.user_roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND r.name = 'ceo'
  )
);

-- Users can view companies in their organization structure
CREATE POLICY "Users can view companies through organizations"
ON public.companies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT o.company_id 
    FROM public.organizations o 
    WHERE o.id = get_user_organization_id(auth.uid())
  )
);

-- Update the create organization function to include company
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
SET search_path = public
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

  SELECT r.name, u.role_id
    INTO v_role_name, v_role_id
  FROM public.users u
  JOIN public.user_roles r ON u.role_id = r.id
  WHERE u.id = v_user_id;

  IF v_role_name IS NULL THEN
    RAISE EXCEPTION 'User role not found';
  END IF;

  IF lower(v_role_name) NOT IN ('ceo', 'admin', 'developer') THEN
    RAISE EXCEPTION 'Not allowed to create company';
  END IF;

  -- Create company
  INSERT INTO public.companies (name, cvr, address, city, postal_code, phone, company_type, primary_color, secondary_color)
  VALUES (_name, _cvr, _address, _city, _postal_code, _phone, _company_type, _primary_color, _secondary_color)
  RETURNING id INTO v_company_id;

  -- Create main organization for the company
  INSERT INTO public.organizations (name, company_id, primary_color, secondary_color)
  VALUES (_name || ' Hovedorganisation', v_company_id, _primary_color, _secondary_color)
  RETURNING id INTO v_org_id;

  -- Update user with organization and mark onboarding complete
  UPDATE public.users
     SET organization_id = v_org_id,
         first_login_completed = true
   WHERE id = v_user_id;

  -- Update/create profile
  INSERT INTO public.profiles (user_id, organization_id, role_id)
  VALUES (v_user_id, v_org_id, v_role_id)
  ON CONFLICT (user_id)
  DO UPDATE SET organization_id = EXCLUDED.organization_id,
                role_id = EXCLUDED.role_id,
                updated_at = now();

  RETURN v_company_id;
END;
$$;

-- Add trigger for companies updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();