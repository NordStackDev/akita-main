-- Create developer role (highest privileges, level 0)
INSERT INTO public.user_roles (name, level, can_register_sale, can_register_sickleave, can_view_stats, can_create_user, can_edit_data, can_delete_user)
VALUES ('developer', 0, true, true, true, true, true, true)
ON CONFLICT (name) DO UPDATE SET
  level = 0,
  can_register_sale = true,
  can_register_sickleave = true,
  can_view_stats = true,
  can_create_user = true,
  can_edit_data = true,
  can_delete_user = true;

-- Create a default organization for development
INSERT INTO public.organizations (id, name, primary_color, secondary_color)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'AKITA Development',
  '#ff0000',
  '#1c1c1c'
) ON CONFLICT (id) DO NOTHING;

-- Add protection policy to prevent developer role modification
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