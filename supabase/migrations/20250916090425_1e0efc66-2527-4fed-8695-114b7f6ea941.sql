-- Fix role name case-sensitivity in admin/developer detection
CREATE OR REPLACE FUNCTION public.is_admin_or_developer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.user_roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
      AND lower(r.name) IN ('admin', 'developer')
  );
$function$;