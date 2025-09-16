-- Function: create organization for current user (CEO/Admin/Developer)
CREATE OR REPLACE FUNCTION public.create_organization_for_current_user(
  _name text,
  _primary_color text DEFAULT '#ff0000',
  _secondary_color text DEFAULT '#1c1c1c'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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

  IF v_role_name NOT IN ('ceo', 'admin', 'developer') THEN
    RAISE EXCEPTION 'Not allowed to create organization';
  END IF;

  INSERT INTO public.organizations (name, primary_color, secondary_color)
  VALUES (_name, _primary_color, _secondary_color)
  RETURNING id INTO v_org_id;

  UPDATE public.users
     SET organization_id = v_org_id,
         first_login_completed = true
   WHERE id = v_user_id;

  INSERT INTO public.profiles (user_id, organization_id, role_id)
  VALUES (v_user_id, v_org_id, v_role_id)
  ON CONFLICT (user_id)
  DO UPDATE SET organization_id = EXCLUDED.organization_id,
                role_id = EXCLUDED.role_id,
                updated_at = now();

  RETURN v_org_id;
END;
$$;