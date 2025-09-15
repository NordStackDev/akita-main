-- First add unique constraint to user_roles name column
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_name_unique UNIQUE (name);

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