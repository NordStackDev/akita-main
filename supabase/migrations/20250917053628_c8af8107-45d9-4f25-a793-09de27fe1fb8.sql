-- Add role and organization tracking to invitation_codes
ALTER TABLE invitation_codes 
ADD COLUMN invited_role text,
ADD COLUMN invited_org_id uuid REFERENCES organizations(id),
ADD COLUMN first_name text,
ADD COLUMN last_name text,
ADD COLUMN phone text,
ADD COLUMN company_name text;

-- Add constraints to ensure data integrity
ALTER TABLE invitation_codes 
ADD CONSTRAINT check_ceo_no_org_id CHECK (
  (invited_role = 'ceo' AND invited_org_id IS NULL) OR 
  (invited_role != 'ceo' AND invited_org_id IS NOT NULL) OR
  invited_role IS NULL
);

-- Create onboarding_progress table to track user onboarding steps
CREATE TABLE public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  current_step text NOT NULL DEFAULT 'start',
  completed_steps jsonb DEFAULT '[]'::jsonb,
  onboarding_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on onboarding_progress
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for onboarding_progress
CREATE POLICY "Users can view their own onboarding progress"
ON public.onboarding_progress
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own onboarding progress"
ON public.onboarding_progress
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own onboarding progress"
ON public.onboarding_progress
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Function to assign role to user
CREATE OR REPLACE FUNCTION public.assign_user_role(user_uuid uuid, role_name text, org_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  role_uuid uuid;
BEGIN
  -- Get role ID from role name
  SELECT id INTO role_uuid FROM user_roles WHERE name = role_name;
  
  IF role_uuid IS NULL THEN
    RAISE EXCEPTION 'Role % not found', role_name;
  END IF;
  
  -- Update user's role and organization
  UPDATE users 
  SET role_id = role_uuid,
      organization_id = org_id,
      updated_at = now()
  WHERE id = user_uuid;
  
  -- Update or create profile
  INSERT INTO profiles (user_id, organization_id, role_id)
  VALUES (user_uuid, org_id, role_uuid)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    organization_id = EXCLUDED.organization_id,
    role_id = EXCLUDED.role_id,
    updated_at = now();
  
  RETURN true;
END;
$$;

-- Function to create onboarding progress entry
CREATE OR REPLACE FUNCTION public.start_user_onboarding(user_uuid uuid, role_name text, initial_data jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  progress_id uuid;
BEGIN
  INSERT INTO onboarding_progress (user_id, role, onboarding_data)
  VALUES (user_uuid, role_name, initial_data)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    role = EXCLUDED.role,
    current_step = 'start',
    completed_steps = '[]'::jsonb,
    onboarding_data = EXCLUDED.onboarding_data,
    updated_at = now()
  RETURNING id INTO progress_id;
  
  RETURN progress_id;
END;
$$;

-- Add trigger to update updated_at on onboarding_progress
CREATE TRIGGER update_onboarding_progress_updated_at
BEFORE UPDATE ON public.onboarding_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();