-- Function to attach auth user to invited users row by email
CREATE OR REPLACE FUNCTION public.attach_auth_user_to_invited_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_auth_id uuid := auth.uid();
  v_auth_email text;
  v_existing_user public.users%ROWTYPE;
BEGIN
  IF v_auth_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT email INTO v_auth_email FROM auth.users WHERE id = v_auth_id;
  IF v_auth_email IS NULL THEN
    RETURN false;
  END IF;

  SELECT * INTO v_existing_user FROM public.users WHERE email = v_auth_email LIMIT 1;

  IF v_existing_user IS NULL THEN
    -- No invited row found; nothing to attach
    RETURN false;
  END IF;

  IF v_existing_user.id <> v_auth_id THEN
    -- Update primary key to match auth user id
    UPDATE public.users
      SET id = v_auth_id
    WHERE id = v_existing_user.id;

    -- Also sync any existing profile row
    UPDATE public.profiles
      SET user_id = v_auth_id,
          organization_id = COALESCE(public.profiles.organization_id, v_existing_user.organization_id),
          role_id = COALESCE(public.profiles.role_id, v_existing_user.role_id)
    WHERE user_id = v_existing_user.id;
  END IF;

  RETURN true;
END;
$$;