CREATE OR REPLACE FUNCTION public.manage_company_for_current_user(
  _action text, -- 'insert', 'update', 'delete'
  _company_id uuid DEFAULT NULL,
  _name text DEFAULT NULL,
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
    RAISE EXCEPTION 'Not allowed to manage company';
  END IF;

  IF _action = 'insert' THEN
    INSERT INTO public.companies (name, cvr, address, city, postal_code, phone, company_type, primary_color, secondary_color)
    VALUES (_name, _cvr, _address, _city, _postal_code, _phone, _company_type, _primary_color, _secondary_color)
    RETURNING id INTO v_company_id;

    INSERT INTO public.organizations (name, company_id, primary_color, secondary_color)
    VALUES (_name || ' Hovedorganisation', v_company_id, _primary_color, _secondary_color)
    RETURNING id INTO v_org_id;

    RETURN v_company_id;
  ELSIF _action = 'update' THEN
    IF _company_id IS NULL THEN
      RAISE EXCEPTION 'Missing company_id for update';
    END IF;
    UPDATE public.companies
    SET name = COALESCE(_name, name),
        cvr = COALESCE(_cvr, cvr),
        address = COALESCE(_address, address),
        city = COALESCE(_city, city),
        postal_code = COALESCE(_postal_code, postal_code),
        phone = COALESCE(_phone, phone),
        company_type = COALESCE(_company_type, company_type),
        primary_color = COALESCE(_primary_color, primary_color),
        secondary_color = COALESCE(_secondary_color, secondary_color)
    WHERE id = _company_id
    RETURNING id INTO v_company_id;
    RETURN v_company_id;
  ELSIF _action = 'delete' THEN
    IF _company_id IS NULL THEN
      RAISE EXCEPTION 'Missing company_id for delete';
    END IF;
    DELETE FROM public.companies WHERE id = _company_id RETURNING id INTO v_company_id;
    RETURN v_company_id;
  ELSE
    RAISE EXCEPTION 'Unknown action: %', _action;
  END IF;
END;
$$;